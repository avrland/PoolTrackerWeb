import os
import uuid
from contextlib import closing
from datetime import datetime
from typing import Any

import pandas as pd
import psycopg2
from psycopg2.extensions import connection as PsycopgConnection
from sqlalchemy import create_engine
from sqlalchemy.engine import URL


def get_db_config() -> dict[str, Any]:
    """Read PostgreSQL connection settings from the shared Docker .env file."""
    required_vars = ("DB_NAME", "DB_USER", "DB_PASSWORD")
    missing_vars = [name for name in required_vars if not os.getenv(name)]

    if missing_vars:
        raise RuntimeError(
            "Missing required database environment variables: "
            + ", ".join(missing_vars)
        )

    try:
        port = int(os.getenv("DB_PORT", "5432"))
    except ValueError as error:
        raise RuntimeError("DB_PORT must be an integer") from error

    return {
        "dbname": os.environ["DB_NAME"],
        "user": os.environ["DB_USER"],
        "password": os.environ["DB_PASSWORD"],
        "host": os.getenv("DB_HOST", "db"),
        "port": port,
    }


def get_db_connection() -> PsycopgConnection:
    """Create a PostgreSQL connection using the shared Docker Compose config."""
    return psycopg2.connect(**get_db_config())


def insert_stats(
    date: datetime,
    people_sport: int,
    people_family: int,
    people_small: int,
    people_ice: int,
) -> None:
    """Insert one scraper reading into the PostgreSQL poolStats table."""
    insert_query = """
        INSERT INTO "poolStats" ("guid", "date", "sport", "family", "small", "ice")
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    values = (
        str(uuid.uuid4()),
        date.replace(tzinfo=None),
        int(people_sport),
        int(people_family),
        int(people_small),
        int(people_ice),
    )

    try:
        with closing(get_db_connection()) as connection:
            with connection:
                with connection.cursor() as cursor:
                    cursor.execute(insert_query, values)
    except (psycopg2.Error, RuntimeError) as error:
        print(f"Error inserting data into the database: {error}")


def get_pools_data() -> pd.DataFrame | None:
    """Load recent pool readings from PostgreSQL into a DataFrame."""
    engine = None

    try:
        config = get_db_config()
        connection_url = URL.create(
            "postgresql+psycopg2",
            username=config["user"],
            password=config["password"],
            host=config["host"],
            port=config["port"],
            database=config["dbname"],
        )
        engine = create_engine(connection_url)

        query = """
            SELECT *
            FROM "poolStats"
            WHERE "date" >= CURRENT_DATE - INTERVAL '14 days'
            ORDER BY "date" ASC
        """

        with engine.connect() as connection:
            df = pd.read_sql(query, connection)

        if df.empty:
            print("No entries found in the table.")

        return df

    except (psycopg2.Error, RuntimeError) as error:
        print(f"Error accessing database: {error}")
        return None
    except Exception as error:
        print(f"Unexpected error accessing database: {error}")
        return None
    finally:
        if engine is not None:
            engine.dispose()


def generate_stats(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate average occupancy per weekday and time slot."""
    df = df.drop(columns=["guid"])

    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date")
    # Scheduler runs can differ by seconds/microseconds between days.
    # Keep raw timestamps intact, but aggregate in stable quarter-hour slots.
    df["time"] = df["date"].dt.floor("15min").dt.time
    df["hour"] = df["date"].dt.hour
    df = df[(df["hour"] >= 6) & (df["hour"] < 22)]
    df["weekday"] = df["date"].dt.day_name()
    df["day"] = df["date"].dt.date

    weekday_order = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ]
    df["weekday"] = pd.Categorical(
        df["weekday"],
        categories=weekday_order,
        ordered=True,
    )

    zero_days = df.groupby("day").filter(lambda x: (x["family"] == 0).all())[
        "day"
    ].unique()
    df = df[~df["day"].isin(zero_days)]

    num_rows = len(df)
    date_range = df["date"].max() - df["date"].min()
    num_days = df["day"].nunique()
    print(f"Readings amount: {num_rows}")
    print(
        "Date of observation range: "
        f"{date_range}, started: {df['date'].min()}, ended: {df['date'].max()}"
    )
    print(f"Pools working days: {num_days} days")

    avg_df = df.groupby(["weekday", "time"], observed=False).agg(
        sport=("sport", "mean"),
        family=("family", "mean"),
        small=("small", "mean"),
        ice=("ice", "mean"),
    ).reset_index().round()

    return avg_df.dropna()


def replace_history_from_df(df: pd.DataFrame) -> pd.DataFrame | None:
    """Atomically replace derived history, preserving the old snapshot on failure."""
    insert_query = """
        INSERT INTO poolstats_history (guid, weekday, time, sport, family, small, ice)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """

    try:
        with closing(get_db_connection()) as connection:
            with connection:
                with connection.cursor() as cursor:
                    # Serialize refreshes while allowing API SELECTs to read
                    # the previous committed snapshot until this one commits.
                    cursor.execute("LOCK TABLE poolstats_history IN SHARE ROW EXCLUSIVE MODE")
                    cursor.execute("DELETE FROM poolstats_history")
                    for _, row in df.iterrows():
                        cursor.execute(
                            insert_query,
                            (
                                str(uuid.uuid4()),
                                str(row["weekday"]),
                                row["time"],
                                int(row["sport"]),
                                int(row["family"]),
                                int(row["small"]),
                                int(row["ice"]),
                            ),
                        )

        return df

    except (psycopg2.Error, RuntimeError) as error:
        print(f"Error accessing database: {error}")
        return None


def update_history() -> None:
    """Refresh the generated history table from recent scraper readings."""
    df = get_pools_data()
    if df is None:
        print("Could not load pool stats; preserving existing history.")
        return

    df_stats = generate_stats(df) if not df.empty else pd.DataFrame()
    replace_history_from_df(df_stats)


if __name__ == "__main__":
    update_history()
