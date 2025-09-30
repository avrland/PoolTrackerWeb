# PoolTrackerWeb
![ss1](https://github.com/avrland/PoolTrackerWeb/blob/develop/images/2.png)

Reads data from database about pool occupacy, puts it on line chart and does some calculations. All in one docker compose solution (scrapper+db+web).

## Features
- occupancy live chart for current day (for my observed pools it's from 6:00 AM)
- mean occupancy chart for each weekday from last 60 days (updated every day), day is selectable, default it's current day
- max lines showing max pool cap
- charts are zoomable, right click brings back to standard view 
- dashboard showing % occupancy live for each pool, colouring red when it's over 80%, green when below

## Installation (for local development)

1. Use latest python, install pip requirments
```
pip install django pymysql plotly pandas
```
2. Clone repo
```
git clone https://github.com/avrland/PoolTrackerWeb.git
```
3. Generate django secret key.
```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```
4. Insert mysql credentials (the same as for [PoolTracker scrapper part](https://github.com/avrland/PoolTracker) secret key, gemini api key, openweathermap api key into .env file:
```env
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=
SECRET_KEY=
OPENWEATHER_API_KEY=
GEMINI_API_KEY=
```
5. Run locally mariadb
```
Go to dev_db/
docker compose up -d
```
5. Run django server
```
python manage.py runserver 0.0.0.0:80
```

## Docker image (for production)
```
docker compose build --no-cache
docker compose up -d
```

## Repository sctructure
```
PoolTrackerWeb/
    data_scrapper/ <- python api scrapper part
    dev_db/ <- docker compose for dev mariadb
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
