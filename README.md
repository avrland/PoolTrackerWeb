# PoolTrackerWeb
![ss1](https://raw.githubusercontent.com/avrland/PoolTrackerWeb/main/images/1.png)

Django&bootstrap based web app part of [PoolTracker](https://github.com/avrland/PoolTracker) project. Reads data from PoolTracker mysql database, puts it on line chart and does some calculations.

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

## Credits
- Frontend from template [bootstrapmade.com](https://bootstrapmade.com/nice-admin-bootstrap-admin-html-template/)
- Favicon [www.flaticon.com](https://www.flaticon.com/free-icon/swimmer_3091014?term=swimming+pool&page=1&position=56&origin=tag&related_id=3091014)
