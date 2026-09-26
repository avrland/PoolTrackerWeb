"""Live HTTP retirement contract. Supply RETIREMENT_PUBLIC/BACKEND/DEV URLs."""

import json
import os
import time
import unittest
from email.message import Message
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def response(base: str, path: str, method: str = 'GET') -> tuple[int, Message, bytes]:
    request = Request(base + path, data=b'{}' if method == 'POST' else None,
                      headers={'Content-Type': 'application/json', 'Host': 'localhost'}, method=method)
    try:
        result = urlopen(request, timeout=15)
    except HTTPError as error:
        result = error
    with result:
        return result.status, result.headers, result.read()


class RetirementHTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        for layer in ('PUBLIC', 'BACKEND', 'DEV'):
            for attempt in range(30):
                try:
                    response(os.environ['RETIREMENT_' + layer], '/chatbot')
                    break
                except URLError:
                    if attempt == 29:
                        raise
                    time.sleep(1)

    def test_retired_prefixes(self) -> None:
        for layer, expected in [('PUBLIC', 410), ('BACKEND', 404), ('DEV', 404)]:
            base = os.environ['RETIREMENT_' + layer]
            for path in ['/chatbot', '/chatbot/', '/chatbot/api/chat/', '/chatbot/old.js', '/chatbot/api/chat/?probe=1']:
                for method in ['GET', 'POST', 'HEAD', 'OPTIONS']:
                    with self.subTest(layer=layer, path=path, method=method):
                        status, headers, body = response(base, path, method)
                        self.assertEqual(status, expected)
                        if layer == 'PUBLIC':
                            self.assertIn('no-store', headers.get('Cache-Control', ''))
                            if method != 'HEAD':
                                self.assertEqual(json.loads(body), {'error': 'Ta funkcja została wycofana.'})
                                self.assertIn('application/json', headers['Content-Type'])

    def test_unrelated_spa_path_is_not_retired(self) -> None:
        for layer in ('PUBLIC', 'DEV'):
            self.assertEqual(response(os.environ['RETIREMENT_' + layer], '/chatbot-other')[0], 200)


if __name__ == '__main__':
    unittest.main()
