"""Run inside the freshly built web image; no retired distributions may remain."""

import importlib.metadata
import os
import unittest


class RuntimeRetirementTests(unittest.TestCase):
    def test_no_retired_distributions(self) -> None:
        installed = {dist.metadata['Name'].lower().replace('_', '-') for dist in importlib.metadata.distributions()}
        self.assertFalse(installed & {'langchain', 'langchain-google-genai', 'qdrant-client', 'pydantic', 'bleach'})

    def test_start_without_retired_settings(self) -> None:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tablechart.settings')
        import django
        django.setup()
        from django.conf import settings
        for name in ('GEMINI_API_KEY', 'DONATION_LIST_PATH', 'GODMODE_EMAIL', 'BUYCOFFEE_URL'):
            self.assertFalse(hasattr(settings, name), name)


if __name__ == '__main__':
    unittest.main()
