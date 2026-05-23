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
