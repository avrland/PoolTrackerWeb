from django.db import connection
import pandas as pd
from django.http import JsonResponse
from datetime import datetime, timedelta
from django.core.cache import cache
import pytz
import requests
from django.conf import settings
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import ensure_csrf_cookie
from django_ratelimit.decorators import ratelimit

def _load_fulldata():
    """Load historical data from cache or DB fallback."""
    data = cache.get('fulldata')
    if not data:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT weekday, time, sport, family, small, ice FROM poolstats_history ORDER BY time ASC"
            )
            data = cursor.fetchall()
        if data:
            cache.set('fulldata', data)
    return data

def update_chart(request, day):
    data = _load_fulldata()
    if not data or len(data) == 0:
        response_data = {'today': 0, 'date_stat': 0, 'sport_stat' : 0, 'family_stat' : 0, 'small_stat': 0}
        return JsonResponse(response_data)
    
    df = pd.DataFrame(data, columns=['weekday', 'time', 'sport', 'family', 'small', 'ice'])
    weekday_names = {0: "Poniedziałek", 1: "Wtorek", 2: "Środa", 3: "Czwartek", 4: "Piątek", 5: "Sobota", 6: "Niedziela"}
    weekday_names_en = {0: "Monday", 1: "Tuesday", 2: "Wednesday", 3: "Thursday", 4: "Friday", 5: "Saturday", 6: "Sunday"}
    df_sunday = df[df['weekday'] == weekday_names_en[day]]
    time_sunday = df_sunday['time']
    # T011: subtract 1h to correct scrapper's +1h offset stored in naive TIME column
    time_sunday_formatted = [
        (datetime.combine(datetime.today().date(), t) - timedelta(hours=1)).strftime("%H:%M")
        for t in time_sunday
    ]
    sport = df_sunday['sport']
    family = df_sunday['family']
    small = df_sunday['small']
    response_data = {'today': weekday_names[day], 'date_stat': time_sunday_formatted, 
                     'sport_stat' : list(sport), 'family_stat' : list(family), 'small_stat': list(small)}
    return JsonResponse(response_data)

@require_GET
@ratelimit(key='ip', rate='60/m', method='GET', block=True)
def get_date_data(request):
    """Fetch occupancy data for a specific date"""
    session_id = request.headers.get('X-Session-Key') or request.GET.get('session_id')
    active_session = request.session.session_key

    if not session_id:
        return JsonResponse({'error': 'Brak autoryzacji'}, status=401)

    if not active_session:
        return JsonResponse({'error': 'Sesja wygasła'}, status=401)

    if session_id != active_session:
        return JsonResponse({'error': 'Nieprawidłowa sesja'}, status=403)

    selected_date = request.GET.get('date')
    
    if not selected_date:
        return JsonResponse({'error': 'No date provided'}, status=400)
    
    try:
        # Parse the selected date
        pl = pytz.timezone('Europe/Warsaw')
        selected_datetime = datetime.strptime(selected_date, '%Y-%m-%d')
        
        # Set time range from 6 AM to 9 PM (21:00)
        start_time = pl.localize(datetime(selected_datetime.year, selected_datetime.month, selected_datetime.day, 6, 0, 0))
        end_time = pl.localize(datetime(selected_datetime.year, selected_datetime.month, selected_datetime.day, 21, 0, 0))
        
        # Query database for the selected date range
        with connection.cursor() as cursor:
            sql_query = 'SELECT date, sport, family, small, ice FROM "poolStats" WHERE date >= %s AND date <= %s ORDER BY date ASC'
            cursor.execute(sql_query, [start_time.strftime('%Y-%m-%d %H:%M:%S'), end_time.strftime('%Y-%m-%d %H:%M:%S')])
            data = cursor.fetchall()
        
        if len(data) == 0:
            return JsonResponse({
                'error': 'Brak danych dla wybranej daty.',
                'date': [],
                'sport': [],
                'family': [],
                'small': [],
                'ice': [],
                'lastdate': 'Brak danych',
                'display_date': selected_datetime.strftime('%d.%m.%Y')
            })
        
        # Process the data
        df = pd.DataFrame(data, columns=['date', 'sport', 'family', 'small', 'ice'])
        tz = pytz.timezone('Europe/Warsaw')
        date = pd.to_datetime(df['date']).dt.tz_localize('UTC').dt.tz_convert(tz)
        
        sport = df['sport']
        family = df['family']
        small = df['small']
        ice = df['ice']
        
        # Use the parsed datetime series for formatting
        last_date = date.iloc[-1].strftime('%d.%m.%Y %H:%M')
        display_date = selected_datetime.strftime('%d.%m.%Y')
        
        return JsonResponse({
            'date': list(date.dt.strftime('%Y-%m-%d %H:%M')),
            'sport': list(sport),
            'family': list(family),
            'small': list(small),
            'ice': list(ice),
            'lastdate': last_date,
            'display_date': display_date
        })
    
    except ValueError:
        return JsonResponse({'error': 'Nieprawidłowy format daty'}, status=400)
    except Exception:
        return JsonResponse({'error': 'Wystąpił błąd podczas pobierania danych'}, status=500)

@ensure_csrf_cookie
@require_GET
def api_available_dates_view(request):
    """Return distinct available dates (YYYY-MM-DD) for day chart datepicker."""
    with connection.cursor() as cursor:
        cursor.execute('SELECT DISTINCT DATE(date) AS day FROM "poolStats" ORDER BY day ASC')
        rows = cursor.fetchall()

    dates = [row[0].strftime('%Y-%m-%d') for row in rows if row and row[0]]
    return JsonResponse({'dates': dates})


@ensure_csrf_cookie
@require_GET
def api_current_view(request):
    """Return current pool occupancy data as JSON for the React SPA frontend."""
    if not request.session.session_key:
        request.session.save()

    # Populate fulldata cache so update_chart/stats<day> endpoints work.
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT weekday, time, sport, family, small, ice FROM poolstats_history ORDER BY time ASC"
        )
        fulldata = cursor.fetchall()
        cache.set('fulldata', fulldata)

    pl = pytz.timezone('Europe/Warsaw')
    now = datetime.now().astimezone(pl)
    today = datetime(now.year, now.month, now.day, 6)

    with connection.cursor() as cursor:
        sql_query = 'SELECT date, sport, family, small, ice FROM "poolStats" WHERE date >= %s ORDER BY date ASC'
        cursor.execute(sql_query, [today])
        data = cursor.fetchall()

    if len(data) == 0:
        return JsonResponse({
            'date': [],
            'sport': [],
            'family': [],
            'small': [],
            'ice': [],
            'lastdate': 'Brak danych z bieżącego dnia.',
            'lastsport': 0,
            'lastfamily': 0,
            'lastsmall': 0,
            'lastice': 0,
            'sport_percent': 0,
            'family_percent': 0,
            'small_percent': 0,
            'ice_percent': 0,
            'session_id': request.session.session_key,
            'opening': days_until_opening(),
        })

    df = pd.DataFrame(data, columns=['date', 'sport', 'family', 'small', 'ice'])
    tz = pytz.timezone('Europe/Warsaw')
    date_series = pd.to_datetime(df['date']).dt.tz_localize('UTC').dt.tz_convert(tz)

    sport = df['sport']
    family = df['family']
    small = df['small']
    ice = df['ice']

    last_sport = int(sport.iloc[-1])
    last_family = int(family.iloc[-1])
    last_small = int(small.iloc[-1])
    last_ice = int(ice.iloc[-1])

    return JsonResponse({
        'date': list(date_series.dt.strftime('%Y-%m-%d %H:%M')),
        'sport': list(sport),
        'family': list(family),
        'small': list(small),
        'ice': list(ice),
        'lastdate': df['date'].iloc[-1].strftime('%d.%m.%Y %H:%M'),
        'lastsport': last_sport,
        'lastfamily': last_family,
        'lastsmall': last_small,
        'lastice': last_ice,
        'sport_percent': round((last_sport / 105) * 100),
        'family_percent': round((last_family / 150) * 100),
        'small_percent': round((last_small / 30) * 100),
        'ice_percent': round((last_ice / 300) * 100),
        'session_id': request.session.session_key,
        'opening': days_until_opening(),
    })


def days_until_opening():
    tz = pytz.timezone('Europe/Warsaw')
    today = datetime.now(tz)
    target_date = tz.localize(datetime(2028, 12, 15))
    delta = target_date - today
    
    # Return just the days as integer
    return delta.days

API_KEY = settings.OPENWEATHER_API_KEY
CITY = 'Białystok,pl'
URL = f'https://api.openweathermap.org/data/2.5/weather?q={CITY}&appid={API_KEY}&units=metric&lang=pl'

def get_weather_data():
    """Fetch weather data for Białystok with 10-minute server-side cache."""
    # T013: cache weather response to avoid hitting API on every request
    cache_key = 'weather_data'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    try:
        response = requests.get(URL, timeout=5)
        response.raise_for_status()
        data = response.json()
        weather = {
            'icon': data['weather'][0]['icon'],
            'description': data['weather'][0]['description'].capitalize(),
            'temp': round(data['main']['temp']),
            'feels_like': round(data['main']['feels_like']),
            'humidity': data['main']['humidity'],
        }
        cache.set(cache_key, weather, 600)  # cache for 10 minutes
        return weather
    except requests.RequestException:
        return None


@require_GET
def api_weather_view(request):
    """Return cached weather data for Białystok as JSON for the React frontend."""
    weather = get_weather_data()
    if weather is None:
        return JsonResponse({'error': 'Usługa pogodowa niedostępna'}, status=503)
    response = JsonResponse(weather)
    response['Cache-Control'] = 'public, max-age=600'
    return response
