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

**Requirements**: Docker Desktop (or Docker Engine + Compose plugin)

1. Copy and fill in the environment file:
```
cd tablechart/
cp .env.example .env
# Edit .env — set DB_NAME, DB_USER, DB_PASSWORD, SECRET_KEY, API keys
```

2. Build and start all containers (PostgreSQL + Django):
```
docker compose up --build
```

This single command will:
- Start a PostgreSQL 16 container and wait until it is healthy
- Run `python manage.py migrate` automatically
- Run `python manage.py collectstatic` automatically
- Start Gunicorn on port 80

3. To stop and preserve data:
```
docker compose down
```

4. To reset everything including the database:
```
docker compose down -v
```

For detailed troubleshooting see [specs/001-postgres-docker-setup/quickstart.md](specs/001-postgres-docker-setup/quickstart.md).

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
