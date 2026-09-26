import os
import unittest
from contextlib import nullcontext
from datetime import datetime, time
from unittest.mock import patch

import pandas as pd
import psycopg2

from scrapper import db_handler


def readings(*rows):
    return pd.DataFrame([
        {
            "guid": str(index),
            "date": datetime.fromisoformat(date),
            "sport": sport,
            "family": family,
            "small": small,
            "ice": ice,
        }
        for index, (date, sport, family, small, ice) in enumerate(rows)
    ])


class GenerateStatsTests(unittest.TestCase):
    def test_averages_same_quarter_hour_across_weeks(self):
        source = readings(
            ("2026-09-14 08:00:00.123456", 10, 20, 2, 40),
            ("2026-09-21 08:00:01.654321", 30, 40, 6, 80),
            ("2026-09-21 08:15:00.456789", 50, 60, 10, 100),
        )
        original = source.copy(deep=True)

        result = db_handler.generate_stats(source).set_index(["weekday", "time"])

        self.assertEqual(len(result), 2)
        self.assertEqual(
            result.loc[("Monday", time(8))].to_dict(),
            {"sport": 20, "family": 30, "small": 4, "ice": 60},
        )
        self.assertEqual(result.loc[("Monday", time(8, 15)), "sport"], 50)
        pd.testing.assert_frame_equal(source, original)

    def test_slot_boundaries_and_opening_hours(self):
        source = readings(*[
            (f"2026-09-21 {clock}", value, 10, 1, 0)
            for clock, value in [
                ("05:59:59.999999", 100),
                ("06:00:00.000001", 10),
                ("06:14:59.999999", 30),
                ("06:15:00", 50),
                ("21:59:59.999999", 70),
                ("22:00:00", 100),
            ]
        ])

        result = db_handler.generate_stats(source)

        self.assertEqual(list(result["time"]), [time(6), time(6, 15), time(21, 45)])
        self.assertEqual(list(result["sport"]), [20, 50, 70])

    def test_days_without_family_occupancy_remain_excluded(self):
        source = readings(
            ("2026-09-14 08:00:00.123456", 100, 0, 20, 40),
            ("2026-09-21 08:00:00.654321", 30, 10, 6, 80),
        )

        result = db_handler.generate_stats(source)

        self.assertEqual(len(result), 1)
        self.assertEqual(result.iloc[0]["sport"], 30)


class UpdateHistoryTests(unittest.TestCase):
    @patch.object(db_handler, "replace_history_from_df")
    @patch.object(db_handler, "get_pools_data", return_value=None)
    def test_read_failure_preserves_previous_history(self, load, replace):
        db_handler.update_history()
        replace.assert_not_called()

    @patch.object(db_handler, "replace_history_from_df")
    @patch.object(db_handler, "get_pools_data", return_value=pd.DataFrame())
    def test_successful_empty_read_clears_stale_history(self, load, replace):
        db_handler.update_history()
        replace.assert_called_once()
        self.assertTrue(replace.call_args.args[0].empty)

    @patch.object(db_handler, "replace_history_from_df")
    @patch.object(db_handler, "get_pools_data")
    def test_all_excluded_days_clear_stale_history(self, load, replace):
        load.return_value = readings(("2026-09-21 08:00:00", 10, 0, 2, 0))

        db_handler.update_history()

        replace.assert_called_once()
        self.assertTrue(replace.call_args.args[0].empty)

    @patch.object(db_handler, "get_db_config")
    @patch.object(db_handler, "create_engine")
    @patch.object(db_handler.pd, "read_sql")
    def test_empty_database_result_is_distinct_from_read_failure(self, read_sql, engine, config):
        config.return_value = {
            "dbname": "test", "user": "test", "password": "test",
            "host": "localhost", "port": 5432,
        }
        read_sql.return_value = pd.DataFrame()
        self.assertTrue(db_handler.get_pools_data().empty)

        read_sql.side_effect = RuntimeError("Database unavailable")
        self.assertIsNone(db_handler.get_pools_data())


@unittest.skipUnless(
    os.getenv("SCRAPPER_TEST_DATABASE_URL"),
    "Set SCRAPPER_TEST_DATABASE_URL to run PostgreSQL transaction tests",
)
class HistoryTransactionTests(unittest.TestCase):
    def setUp(self):
        self.connection = psycopg2.connect(os.environ["SCRAPPER_TEST_DATABASE_URL"])
        self.addCleanup(self.connection.close)
        with self.connection:
            with self.connection.cursor() as cursor:
                # A session-local table shadows the real table; no persistent
                # application data is modified by these tests.
                cursor.execute("""
                    CREATE TEMP TABLE poolstats_history (
                        guid VARCHAR(36) PRIMARY KEY,
                        weekday VARCHAR(10), time TIME,
                        sport INTEGER, family INTEGER, small INTEGER, ice INTEGER,
                        update_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
        factory = patch.object(db_handler, "get_db_connection", return_value=self.connection)
        closer = patch.object(db_handler, "closing", nullcontext)
        factory.start()
        closer.start()
        self.addCleanup(factory.stop)
        self.addCleanup(closer.stop)

    @staticmethod
    def snapshot(*rows):
        return pd.DataFrame([
            {"weekday": day, "time": clock, "sport": sport, "family": 10, "small": 2, "ice": 0}
            for day, clock, sport in rows
        ])

    def stored_rows(self):
        with self.connection:
            with self.connection.cursor() as cursor:
                cursor.execute("SELECT weekday, time, sport FROM poolstats_history ORDER BY weekday, time")
                return cursor.fetchall()

    def test_refresh_adds_new_slots_updates_existing_and_removes_expired(self):
        initial = self.snapshot(("Monday", time(8), 10), ("Wednesday", time(9), 30))
        self.assertIsNotNone(db_handler.replace_history_from_df(initial))

        updated = self.snapshot(("Monday", time(8), 20), ("Tuesday", time(8, 15), 40))
        self.assertIsNotNone(db_handler.replace_history_from_df(updated))
        self.assertEqual(self.stored_rows(), [
            ("Monday", time(8), 20), ("Tuesday", time(8, 15), 40),
        ])

    def test_empty_snapshot_removes_expired_history(self):
        db_handler.replace_history_from_df(self.snapshot(("Monday", time(8), 10)))

        self.assertIsNotNone(db_handler.replace_history_from_df(pd.DataFrame()))

        self.assertEqual(self.stored_rows(), [])

    def test_failed_insert_rolls_back_delete_and_partial_inserts(self):
        db_handler.replace_history_from_df(self.snapshot(("Monday", time(8), 10)))
        invalid = self.snapshot(("Tuesday", time(9), 20), ("Wednesday", "invalid-time", 30))

        self.assertIsNone(db_handler.replace_history_from_df(invalid))

        self.assertEqual(self.stored_rows(), [("Monday", time(8), 10)])


if __name__ == "__main__":
    unittest.main()
