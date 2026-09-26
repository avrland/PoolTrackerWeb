# PoolTrackerWeb

Pool occupancy dashboard for Białystok, with a Polish interface. React/Vite displays
current readings, data for a selected date, weekday averages, weather and facility
details. Both light and dark themes are supported. Django serves the API,
PostgreSQL stores readings, and the Python scraper collects and aggregates them.

## Development

Copy `tablechart/.env.example` to `tablechart/.env` and configure an isolated
PostgreSQL database, `SECRET_KEY`, `DB_HOST` and `DJANGO_DEBUG=True`.
Initialize the measurement schema using `tablechart/initdb/` in that development
database; Django migrations manage sessions and framework tables.

```sh
cd tablechart
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

In another terminal, from the repository root:

```sh
npm --prefix frontend ci --legacy-peer-deps
npm --prefix frontend run dev
```

Open http://localhost:5173. Vite proxies API calls to localhost:8000.
An optional `OPENWEATHER_API_KEY` enables weather data.

## Docker deployment

Copy `.env.example` to `.env` and set database credentials and a strong Django
secret. Set `DJANGO_DEBUG=False` for production. Use Docker Engine and Compose v2.

The five services are:

| Service | Purpose |
| --- | --- |
| `db` | PostgreSQL 16 and persistent measurements |
| `web` | Django API served by Gunicorn |
| `frontend` | React build served by Nginx, public port **8008** |
| `scrapper` | Pool measurements and weekday aggregates |
| `backup` | Database backups in `./backups/` |

```sh
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

Open http://localhost:8008. Production HTTPS is terminated by the external proxy.
Compose uses fixed container names: use a separate host/context for validation.
`docker compose down` preserves named volumes; never use `down -v` during upgrades.

Backup settings are `SCHEDULE`, `BACKUP_KEEP_DAYS`, and `BACKUP_KEEP_WEEKS`.
The existing Compose/example default remains `@weekly`; daily backup automation
and the 24-hour recovery requirement need separate work and are not implemented
by this cleanup. An immediate backup can be triggered with
`docker compose exec backup /bin/sh -c /backup.sh`.

## Upgrading from a version with retired features

Chatbot, donations, donor verification and ad-free activation have been retired.
Their settings and provider credentials are no longer used. Public `/chatbot`
and `/chatbot/…` requests return JSON with **410 Gone**; direct Django and Vite
development requests return **404**. Vite retains a narrow proxy rule to prevent
its SPA fallback from making a retired URL appear available.

Existing private data is **preserved pending a separate decision**. Before
recreating an old container, stop retired-feature writes and inspect the presence
of `/app/logs/chat_history.csv`, `/logs/chat_history.csv`, and the formerly
configured donor-file location. `/app/logs/` was not covered by the Compose log
volume. Copy files from the container layer to a new private location outside the
repository and public directories; compare sizes and SHA-256 checksums. Keep a
private manifest of locations and hashes. Missing files require no invented data.

Do not delete old conversation/message tables, migration records, content types,
volumes, files or backups. Normal `migrate` leaves dormant tables alone; a clean
installation does not create them. Archive files and private environment files
are excluded from the backend image. Do not clean stale content types or unapply
the removed application's migration.

Record old image IDs before release. After preserving files, build and start the
new version, run ordinary migrations and smoke-test pool data, sessions, themes
and retired URLs. A rollback must use a repair image with the known-good pool
code **and retirement rules still applied**, including removal of the backend
registration; do not restore the old chatbot or its credentials.

See the [release and validation procedure](specs/007-remove-retired-features/quickstart.md)
and [recorded validation](specs/007-remove-retired-features/validation.md).
These describe local rehearsals; production archives must be checked at deployment.

## Tests

```sh
cd tablechart
python manage.py test chart_app
cd ..
npm --prefix frontend run test:run
npm --prefix frontend run test:coverage
python -m unittest discover -s scrapper/tests -v
```

Scraper transaction tests require `SCRAPPER_TEST_DATABASE_URL` pointing to an
isolated test database. Additional HTTP, runtime and archive checks live in
`tests/retirement/`.

## Repository

- `frontend/`: active React interface and Nginx/Vite configuration.
- `tablechart/chart_app/`: active Django endpoints.
- `tablechart/tablechart/`: Django settings and routing.
- `scrapper/`: collection and aggregation.
- `specs/`: specifications, including historical decisions retained for context.

The retired `rework/` and `darkmode/` mockups are removed; the active theme
components remain in `frontend/src/`.

## Credits

- Legacy template/assets: [BootstrapMade NiceAdmin](https://bootstrapmade.com/nice-admin-bootstrap-admin-html-template/).
- Favicon: [Flaticon](https://www.flaticon.com/free-icon/swimmer_3091014).
