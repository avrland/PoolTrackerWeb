from unittest.mock import patch

from django.test import SimpleTestCase


class HealthTests(SimpleTestCase):
    @patch("tablechart.health.connection")
    def test_database_available(self, connection):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})
        connection.cursor.return_value.__enter__.return_value.execute.assert_called_once_with("SELECT 1")

    @patch("tablechart.health.connection")
    def test_database_failure_does_not_disclose_details(self, connection):
        connection.cursor.side_effect = RuntimeError("secret database credentials")
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {"status": "unavailable"})
