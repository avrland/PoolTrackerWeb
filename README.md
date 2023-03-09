# PoolTrackerWeb
Django based web app part of [PoolTracker](https://github.com/avrland/PoolTracker) project. Reads data from PoolTracker mysql database, puts it on line chart and does some calculations.

1. Install pip requirments
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
4. Insert mysql credentials (the same as for [PoolTracker scrapper part](https://github.com/avrland/PoolTracker) and secret key.
```json
{
    "NAME": "...",
    "USER": "...",
    "PASSWORD": "...",
    "HOST": "...",
    "PORT": "...",
    "SECRET_KEY": "..."
}
```
5. Run django server
```
python manage.py runserver 0.0.0.0:80
```

## To do
- put app into Docker container
