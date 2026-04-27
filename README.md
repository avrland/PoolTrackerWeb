# PoolTrackerWeb
![ss1](https://github.com/avrland/PoolTrackerWeb/blob/develop/images/2.png)

Django&bootstrap based web app part of [PoolTracker](https://github.com/avrland/PoolTracker) project. Reads data from PoolTracker PostgreSQL database, puts it on line chart and does some calculations.

## Features
- occupancy live chart for current day (for my observed pools it's from 6:00 AM)
- mean occupancy chart for each weekday from last 60 days (updated every day), day is selectable, default it's current day
- max lines showing max pool cap
- charts are zoomable, right click brings back to standard view 
- dashboard showing % occupancy live for each pool, colouring red when it's over 80%, green when below

## Installation (for local development)

1. Clone repo
```
git clone https://github.com/avrland/PoolTrackerWeb.git
cd PoolTrackerWeb/tablechart
```
2. Install requirements
```
pip install -r requirements.txt
```
3. Copy and fill in the environment file:
```
cp .env.example .env
```
Edit `.env` and set your database credentials, Django secret key, and API keys.

4. Run Django migrations and start the dev server:
```
python manage.py migrate
python manage.py runserver
```

## Docker Setup (production)

**Requirements**: Docker Engine ≥ 24.0 + Docker Compose v2

The system runs as **4 containers** orchestrated from the repository root:
- `pooltracker-db` — PostgreSQL 16 database
- `pooltracker-web` — Django web application (Gunicorn on port 8000)
- `pooltracker-scrapper` — Data scrapper (collects pool occupancy every 15 min)
- `pooltracker-backup` — Automatic weekly database backup to `./backups/`

### Quick start

1. Copy and fill in the environment file:
```
cp .env.example .env
# Edit .env — set DB_PASSWORD, SECRET_KEY and optionally API keys
```

2. Start all containers from the repository root:
```
docker compose up -d
```

3. Verify all services are running:
```
docker compose ps
```

Expected output:
```
pooltracker-db       running (healthy)
pooltracker-web      running
pooltracker-scrapper running
pooltracker-backup   running
```

4. Open the app at http://localhost:8000

### Environment variables

All configuration is in `.env` (copy from `.env.example`):

| Variable | Description | Required |
|----------|-------------|----------|
| `DB_NAME` | PostgreSQL database name | Yes |
| `DB_USER` | PostgreSQL user | Yes |
| `DB_PASSWORD` | PostgreSQL password | Yes |
| `SECRET_KEY` | Django secret key (min 50 chars) | Yes |
| `DJANGO_DEBUG` | Django debug mode (`False` in production) | No |
| `GEMINI_API_KEY` | Gemini API key for chatbot | No |
| `SCHEDULE` | Backup schedule (default: `@weekly`) | No |
| `BACKUP_KEEP_DAYS` | Days to keep backups (default: `30`) | No |

### Verifying the scrapper

After 15 minutes, check that data is being collected:
```
docker compose exec db psql -U $DB_USER -d $DB_NAME -c 'SELECT * FROM "poolStats" ORDER BY date DESC LIMIT 5;'
```

### Manual backup and restore

Trigger an immediate backup:
```
docker compose exec backup /bin/sh -c "/backup.sh"
```

Backup files are stored in `./backups/` on the host as `*.sql.gz` files.

Restore from a backup:
```
gunzip -c ./backups/<filename>.sql.gz | docker compose exec -T db psql -U $DB_USER -d $DB_NAME
```

### Stop and reset

```
# Stop containers (preserves data)
docker compose down

# Stop and delete all data (including database!)
docker compose down -v
```

For detailed troubleshooting see [specs/002-scrapper-docker-integration/quickstart.md](specs/002-scrapper-docker-integration/quickstart.md).

## Repository sctructure
```
PoolTrackerWeb/
    tablechart/
        chart_app/ <- main django app
        chatbot_app/ <- part for chatbot integration
        tablechart/ <- core of django project
        templates/ <- html templates
        static/ <- all static assets
```


## TODO
- info that current day is more or less ocupated that average
- ML model predicting occupancy for rest of the day (need way more data)
- ~~choose slimer python images for docker~~
- ~~weather module~~, gathering info to link occupancy trends with bad/good weather
- ~~clickable popup window with info about pools~~
- ~~SSL cert as browser don't like sites without it~~
- ~~stats chart for each day~~

## Credits
- Frontend from template [bootstrapmade.com](https://bootstrapmade.com/nice-admin-bootstrap-admin-html-template/)
- Favicon [www.flaticon.com](https://www.flaticon.com/free-icon/swimmer_3091014?term=swimming+pool&page=1&position=56&origin=tag&related_id=3091014)
