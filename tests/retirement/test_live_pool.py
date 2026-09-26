"""Active endpoints against synthetic PostgreSQL, with archive access forbidden."""
import os
import unittest
from unittest.mock import patch

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tablechart.settings')
import django
django.setup()

from django.db import connection
from django.test import Client
from django.test.utils import CaptureQueriesContext


class LivePoolTests(unittest.TestCase):
    def test_active_endpoints_do_not_query_archives(self) -> None:
        assert os.environ['DB_NAME'].startswith('retirement_')
        client = Client()
        with CaptureQueriesContext(connection) as queries, patch(
            'requests.sessions.Session.request', side_effect=AssertionError('External network forbidden')
        ):
            current = client.get('/api/current/')
            self.assertEqual(current.status_code, 200)
            session = current.json()['session_id']
            self.assertTrue(session)
            self.assertIn('csrftoken', current.cookies)
            self.assertEqual(client.get('/api/available-dates/').json(), {'dates': ['2026-09-25']})
            self.assertEqual(client.get('/update_chart/stats0').json()['sport_stat'], [12])
            date_url = '/get_date_data/?date=2026-09-25'
            self.assertEqual(client.get(date_url).status_code, 401)
            self.assertEqual(client.get(date_url, HTTP_X_SESSION_KEY='wrong').status_code, 403)
            self.assertEqual(client.get(date_url, HTTP_X_SESSION_KEY=session).json()['sport'], [12])
            for path in ('/chatbot', '/chatbot/', '/chatbot/api/chat/'):
                for method in ('get', 'post', 'head', 'options'):
                    self.assertEqual(getattr(client, method)(path).status_code, 404)
        self.assertTrue(queries.captured_queries)
        self.assertFalse(any('chatbot_' in query['sql'].lower() for query in queries.captured_queries))


if __name__ == '__main__':
    unittest.main()
