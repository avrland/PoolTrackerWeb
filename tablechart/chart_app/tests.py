"""Regressions for active pool contracts and retired routes (no provider calls)."""

from datetime import datetime, time
from unittest.mock import patch

from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponse
from django.test import SimpleTestCase, override_settings


@override_settings(SESSION_ENGINE='django.contrib.sessions.backends.cache',
                   STATICFILES_STORAGE='django.contrib.staticfiles.storage.StaticFilesStorage')
class PoolContractTests(SimpleTestCase):
    def setUp(self) -> None:
        cache.clear()
        self.cursor_patch = patch('chart_app.views.connection')
        self.cursor = self.cursor_patch.start().cursor.return_value.__enter__.return_value
        self.addCleanup(self.cursor_patch.stop)
        self.network = patch('requests.sessions.Session.request', side_effect=AssertionError('Network forbidden'))
        self.network.start()
        self.addCleanup(self.network.stop)

    def current(self) -> HttpResponse:
        self.cursor.fetchall.side_effect = [
            [('Monday', time(9), 12, 4, 1, 0)],
            [(datetime(2026, 9, 25, 10), 12, 4, 1, 0)],
        ]
        response = self.client.get('/api/current/')
        self.cursor.fetchall.side_effect = None
        return response

    def test_current_contract_and_cookies(self) -> None:
        response = self.current()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['lastsport'], 12)
        self.assertEqual(response.json()['lastdate'], '25.09.2026 10:00')
        self.assertTrue(response.json()['session_id'])
        self.assertIn('sessionid', response.cookies)
        self.assertIn('csrftoken', response.cookies)
        self.assertIn('django.middleware.csrf.CsrfViewMiddleware', settings.MIDDLEWARE)

    def test_dates_and_weekday_average(self) -> None:
        self.cursor.fetchall.return_value = [(datetime(2026, 9, 25).date(),)]
        self.assertEqual(self.client.get('/api/available-dates/').json(), {'dates': ['2026-09-25']})
        self.cursor.fetchall.return_value = [('Monday', time(9), 12, 4, 1, 0)]
        data = self.client.get('/update_chart/stats0').json()
        self.assertEqual(data['sport_stat'], [12])
        self.assertEqual(data['today'], 'Poniedziałek')

    def test_date_session_missing_mismatched_and_valid(self) -> None:
        url = '/get_date_data/?date=2026-09-25'
        self.assertEqual(self.client.get(url).status_code, 401)
        self.assertEqual(self.client.get(url, HTTP_X_SESSION_KEY='missing').status_code, 401)
        session = self.current().json()['session_id']
        self.assertEqual(self.client.get(url, HTTP_X_SESSION_KEY='wrong').status_code, 403)
        self.cursor.fetchall.return_value = [(datetime(2026, 9, 25, 10), 12, 4, 1, 0)]
        response = self.client.get(url, HTTP_X_SESSION_KEY=session)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['sport'], [12])
        self.assertEqual(self.client.get('/get_date_data/?date=bad', HTTP_X_SESSION_KEY=session).status_code, 400)

    def test_weather_success_and_unavailable(self) -> None:
        with patch('chart_app.views.get_weather_data', return_value={'temp': 20}):
            self.assertEqual(self.client.get('/api/weather/').json(), {'temp': 20})
        with patch('chart_app.views.get_weather_data', return_value=None):
            self.assertEqual(self.client.get('/api/weather/').status_code, 503)


class RetirementTests(SimpleTestCase):
    def test_app_not_registered(self) -> None:
        self.assertNotIn('chatbot_app', settings.INSTALLED_APPS)

    def test_old_routes_are_not_executable(self) -> None:
        for old_config in ({}, {'GEMINI_API_KEY': 'synthetic-invalid', 'BUYCOFFEE_URL': 'https://invalid.example'}):
            with override_settings(**old_config), patch('socket.socket.connect', side_effect=AssertionError('Network forbidden')):
                for path in ('/chatbot', '/chatbot/', '/chatbot/api/chat/', '/chatbot/old.js'):
                    for method in ('get', 'post', 'head', 'options'):
                        with self.subTest(path=path, method=method, old_config=bool(old_config)):
                            response = getattr(self.client, method)(path, data={} if method == 'post' else None)
                            self.assertEqual(response.status_code, 404)
