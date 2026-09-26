"""Run inside the isolated test web container, never against production."""
import json
import os
import sys
import time
from urllib.request import urlopen

import psycopg2

assert os.environ["DB_NAME"] == "pooltracker_test", "Only the test database is allowed"
deadline = time.monotonic() + 120
while True:
    try:
        with urlopen("http://frontend/api/health/", timeout=5) as response:
            assert json.load(response) == {"status": "ok"}
        with urlopen("http://frontend/", timeout=5) as response:
            assert response.status == 200
            assert b'<div id="root">' in response.read()
        break
    except Exception:
        if time.monotonic() >= deadline:
            raise
        time.sleep(2)

with psycopg2.connect(dbname=os.environ["DB_NAME"], user=os.environ["DB_USER"],
                      password=os.environ["DB_PASSWORD"], host=os.environ["DB_HOST"]) as db:
    with db.cursor() as cursor:
        if sys.argv[1] == "prepare":
            cursor.execute("CREATE TABLE IF NOT EXISTS deploy_probe (id integer PRIMARY KEY)")
            cursor.execute("INSERT INTO deploy_probe VALUES (42) ON CONFLICT DO NOTHING")
        else:
            cursor.execute("SELECT id FROM deploy_probe")
            assert cursor.fetchall() == [(42,)], "Data did not survive application replacement"
print("nginx, Django, PostgreSQL and deployment probe: OK")
