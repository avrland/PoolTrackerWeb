from django.views import View
from django.shortcuts import render
from django.db import connection
import datetime
import plotly.express as px
import pandas as pd
from django.http import JsonResponse
from django.template.loader import render_to_string
from datetime import datetime, timedelta
from django.core.cache import cache
import time
import pytz
import requests
from django.conf import settings
from django.views.decorators.http import require_GET
import json
import logging

# Import ad-free utilities
from chart_app.utils.ad_free import verify_donor_email, validate_email

logger = logging.getLogger(__name__)

ver_num = "0.2.13"

def content_view(request):
    #TODO do one sql query and fetch data to live view
    if not request.session.session_key:
        request.session.save()

    with connection.cursor() as cursor:
        sql_query = f"SELECT weekday, time, sport, family, small, ice FROM poolStats_history ORDER BY `poolStats_history`.`time` ASC"
        cursor.execute(sql_query)
        fulldata = cursor.fetchall()
        cache.set('fulldata', fulldata)
    weekday = datetime.today().weekday()
    stats_chart = stats_view(request, weekday)
    pl = pytz.timezone('Europe/Warsaw')
    now = datetime.now().astimezone(pl)
    today = datetime(now.year, now.month, now.day, 6)
    with connection.cursor() as cursor:
        sql_query = f"SELECT date, sport, family, small, ice FROM poolStats WHERE date >= '{today}' ORDER BY `poolStats`.`date` ASC"
        cursor.execute(sql_query)
        data = cursor.fetchall()
    if len(data) == 0:
        return render(request, 'content.html', {'lastdate': "Brak danych z bieżącego dnia.", 
                            'lastsport' : "0", 'lastfamily' : "0", 'lastsmall': "0",
                            'sport_percent': "0", 'family_percent': "0", 'small_percent': "0", "ice_percent": "0",
                            'session_id': request.session.session_key,
                            'opening': days_until_opening(), 'BUYCOFFEE_URL': settings.BUYCOFFEE_URL})
    
    df = pd.DataFrame(data, columns=['date', 'sport', 'family', 'small', 'ice'])

    tz = pytz.timezone('Europe/Warsaw')
    date = pd.to_datetime(df['date']).dt.tz_localize('UTC').dt.tz_convert(tz)

    sport = df['sport']
    family = df['family']
    small = df['small']
    ice = df['ice']

    last_sport = sport.iloc[-1]
    last_family = family.iloc[-1]
    last_small = small.iloc[-1]
    last_ice = ice.iloc[-1]

    sport_percent = round((last_sport/105)*100)
    family_percent = round((last_family/150)*100)
    small_percent = round((last_small/30)*100)
    ice_percent = round((last_ice/300)*100)
    last_date = df['date'].iloc[-1].strftime('%d.%m.%Y %H:%M')
    return render(request, 'content.html', {'weather': get_weather_data(), 'ver_num': ver_num, 'stats_chart': stats_chart,
                                             'date': list(date.dt.strftime('%Y-%m-%d %H:%M')),
                                            'sport' : list(sport), 'family' : list(family), 'small': list(small), 'ice': list(ice),
                                            'lastdate': last_date, 'lastsport' : last_sport, 'lastfamily' : last_family, 
                                            'lastsmall': last_small, 'lastice': last_ice, 'sport_percent': sport_percent, 
                                            'family_percent': family_percent, 'small_percent': small_percent, 'ice_percent': ice_percent, 'opening': days_until_opening(), 'session_id': request.session.session_key, 'BUYCOFFEE_URL': settings.BUYCOFFEE_URL})

def stats_view(request, weekday):
    data = cache.get('fulldata')
    if len(data) == 0:
        stats_chart = render_to_string('stats_chart.html', {'date_stat': 0, 'sport_stat' : 0, 'family_stat' : 0, 'small_stat': 0})
        return stats_chart   
    pl = pytz.timezone('Europe/Warsaw')
    now = datetime.now().astimezone(pl)
    current_time = now.strftime("%H:%M")
    df = pd.DataFrame(data, columns=['weekday', 'time', 'sport', 'family', 'small', 'ice'])
    print(df)
    weekday_names = {0: "Poniedziałek", 1: "Wtorek", 2: "Środa", 3: "Czwartek", 4: "Piątek", 5: "Sobota", 6: "Niedziela"}
    weekday_names_en = {0: "Monday", 1: "Tuesday", 2: "Wednesday", 3: "Thursday", 4: "Friday", 5: "Saturday", 6: "Sunday"}
    df_sunday = df[df['weekday'] == weekday_names_en[weekday]]
    time_sunday = df_sunday['time']
    time_sunday_formatted = [dt.strftime("%H:%M") for dt in time_sunday]
    sport = df_sunday['sport']
    family = df_sunday['family']
    small = df_sunday['small']
    stats_chart = render_to_string('stats_chart.html', {'current_time': current_time, 'today': weekday_names[weekday], 
                                                        'date_stat': time_sunday_formatted, 'sport_stat' : list(sport), 
                                                        'family_stat' : list(family), 'small_stat': list(small)})
    return stats_chart

def update_chart(request, day):
    data = cache.get('fulldata')   
    if len(data) == 0:
        response_data = {'today': 0, 'date_stat': 0, 'sport_stat' : 0, 'family_stat' : 0, 'small_stat': 0}
        return JsonResponse(response_data)
    
    df = pd.DataFrame(data, columns=['weekday', 'time', 'sport', 'family', 'small', 'ice'])
    weekday_names = {0: "Poniedziałek", 1: "Wtorek", 2: "Środa", 3: "Czwartek", 4: "Piątek", 5: "Sobota", 6: "Niedziela"}
    weekday_names_en = {0: "Monday", 1: "Tuesday", 2: "Wednesday", 3: "Thursday", 4: "Friday", 5: "Saturday", 6: "Sunday"}
    df_sunday = df[df['weekday'] == weekday_names_en[day]]
    time_sunday = df_sunday['time']
    time_sunday_formatted = [dt.strftime("%H:%M") for dt in time_sunday]
    sport = df_sunday['sport']
    family = df_sunday['family']
    small = df_sunday['small']
    stats_chart = render_to_string('stats_chart.html', {'today': weekday_names[day], 'date_stat': time_sunday_formatted, 
                                                        'sport_stat' : list(sport), 'family_stat' : list(family), 
                                                        'small_stat': list(small)})
    response_data = {'today': weekday_names[day], 'date_stat': time_sunday_formatted, 
                     'sport_stat' : list(sport), 'family_stat' : list(family), 'small_stat': list(small)}
    return JsonResponse(response_data)

@require_GET
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
            sql_query = "SELECT date, sport, family, small, ice FROM poolStats WHERE date >= %s AND date <= %s ORDER BY `poolStats`.`date` ASC"
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

def handler404(request, exception):
    return render(request, '404.html', status=404)


def days_until_opening():
    tz = pytz.timezone('Europe/Warsaw')
    today = datetime.now(tz)
    target_date = tz.localize(datetime(2028, 12, 15))
    delta = target_date - today
    
    # Return just the days as integer
    return delta.days

def weather_view(request):
    weather = get_weather_data()
    print(weather)
    context = {'weather': weather}
    return render(request, 'dashboard.html', context)

API_KEY = settings.OPENWEATHER_API_KEY
CITY = 'Białystok,pl'
URL = f'https://api.openweathermap.org/data/2.5/weather?q={CITY}&appid={API_KEY}&units=metric&lang=pl'

def get_weather_data():
    try:
        response = requests.get(URL)
        response.raise_for_status()
        data = response.json()
        print(data)
        weather = {
            'icon': data['weather'][0]['icon'],
            'description': data['weather'][0]['description'].capitalize(),
            'temp': round(data['main']['temp']),
            'feels_like': round(data['main']['feels_like']),
            'humidity': data['main']['humidity']
        }
        return weather
    except requests.RequestException:
        return None


# ============================================================================
# Google Ads Donor Verification Views
# ============================================================================

class VerifyDonorEmailView(View):
    """
    POST endpoint for verifying donor email and setting ad-free cookie.
    
    Returns:
        200: Email verified, cookie set
        400: Invalid email format or missing field
        404: Email not in donor list
        500: Server error (donor list missing/corrupted)
    """
    
    def post(self, request):
        try:
            # Parse JSON body
            data = json.loads(request.body)
            email = data.get('email', '').strip()
            
            if not email:
                return JsonResponse({
                    'success': False,
                    'error': 'Email field is required'
                }, status=400)
            
            # Validate email format
            validated_email = validate_email(email)
            if not validated_email:
                logger.warning(f"Email verification attempt with invalid format: {email}")
                return JsonResponse({
                    'success': False,
                    'error': 'Nieprawidłowy format adresu e-mail'
                }, status=400)
            
            # Verify donor email
            is_donor = verify_donor_email(validated_email)
            
            if is_donor:
                # Create response with success message
                response = JsonResponse({
                    'success': True,
                    'message': 'Dostęp bez reklam przyznany! Dziękujemy za wsparcie.',
                    'expires_in_days': 365
                })
                
                # Set ad-free cookie (365 days = 31536000 seconds)
                response.set_cookie(
                    key='ad_free_session',
                    value=validated_email,
                    max_age=31536000,  # 365 days
                    httponly=True,
                    secure=not settings.DEBUG,  # HTTPS only in production
                    samesite='Lax',
                    path='/'
                )
                
                logger.info(f"Ad-free cookie set for: {validated_email}")
                return response
            else:
                # Email not found in donor list
                logger.info(f"Email verification failed - not in donor list: {validated_email}")
                return JsonResponse({
                    'success': False,
                    'error': 'E-mail nie znaleziony na liście wspierających',
                    'donation_link': settings.BUYCOFFEE_URL
                }, status=404)
                
        except json.JSONDecodeError:
            logger.error("Email verification failed: invalid JSON in request body")
            return JsonResponse({
                'success': False,
                'error': 'Nieprawidłowy format żądania'
            }, status=400)
            
        except Exception as e:
            logger.error(f"Email verification failed with unexpected error: {e}")
            return JsonResponse({
                'success': False,
                'error': 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.'
            }, status=500)


class LogoutAdFreeView(View):
    """
    GET endpoint for removing ad-free cookie and redirecting to homepage.
    """
    
    def get(self, request):
        from django.shortcuts import redirect
        
        response = redirect('/')
        
        # Delete ad-free cookie by setting max_age=0
        response.set_cookie(
            key='ad_free_session',
            value='',
            max_age=0,
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax',
            path='/'
        )
        
        logger.info("Ad-free session logged out")
        return response
