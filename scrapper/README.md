# PoolTracker Scrapper

Pool occupancy data scrapper for PoolTrackerWeb. The scrapper runs as the
`pooltracker-scrapper` service in the root `docker-compose.yml` and writes to
the shared PostgreSQL database service named `db`.

## Database configuration

The scrapper uses the same root `.env` variables as the Django app:

```dotenv
DB_NAME=pooltracker
DB_USER=pooltracker_user
DB_PASSWORD=change-me
DB_HOST=db
DB_PORT=5432
```

There is no separate `db_config.json`. The database schema is initialized by
`tablechart/initdb/poolStats.sql` when the root PostgreSQL container starts for
the first time.

## Run

From the repository root:

```bash
docker compose up -d --build scrapper
```

To run the whole app stack:

```bash
docker compose up -d --build
```

Check scrapper logs:

```bash
docker compose logs -f scrapper
```

The scheduler fetches data every 15 minutes and updates generated history data
once per day.

History averages use 15-minute slots (for example, 08:00:01 and 08:14:59
belong to 08:00). Raw reading timestamps are preserved. Each refresh replaces
the entire derived history in one transaction, adding new slots and removing
expired ones. A successful read with no usable readings clears history;
database failures preserve the previous snapshot.

## Tests

After installing `scrapper/requirements.txt`, run from the repository root:

```bash
python -m unittest discover -s scrapper/tests -v
```

PostgreSQL transaction tests are enabled when `SCRAPPER_TEST_DATABASE_URL`
contains a test database connection URL. They use session-local temporary
tables and check replacement, clearing, and rollback after a failed insert.
Without that variable, transaction tests are skipped.

## Data fetched from API

The source API returns entries like:

```json
[
  {
    "title": "Pływalnia Sportowa",
    "content": "Aktualnie na pływalni: 96 osób<br />Maksymalnie: 105 osób"
  },
  {
    "title": "Pływalnia Rodzinna",
    "content": "Aktualnie na pływalni: 95 osób<br />Maksymalnie: 150 osób"
  },
  {
    "title": "Pływalnia Kameralna",
    "content": "Aktualnie na pływalni: 25 osób<br />Maksymalnie: 30 osób"
  },
  {
    "title": "Lodowisko",
    "content": "Aktualnie na ślizgawce: 0 osób<br />Maksymalnie: 300 osób"
  }
]
```

The scrapper stores those categories as `sport`, `family`, `small`, and `ice`
columns in PostgreSQL table `"poolStats"`.
