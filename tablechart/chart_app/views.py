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
from django.http import JsonResponse
from botocore.exceptions import ClientError
from django.conf import settings
from dotenv import load_dotenv
import os
import json
from decimal import Decimal
from .aws_dynamodb import get_dynamodb_resource

load_dotenv()

ver_num = "0.1.9"

class DecimalEncoder(json.JSONEncoder):
    """Encoder do konwersji Decimal na float/int dla JSON"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def convert_dynamodb_to_dataframe(items):
    """Konwertuje items z DynamoDB do DataFrame"""
    converted_items = []
    
    for item in items:
        converted_item = {
            'date': item['datetime'],  # datetime z DynamoDB -> date dla DataFrame
            'sport': float(item['sport']) if item['sport'] else 0,
            'family': float(item['family']) if item['family'] else 0, 
            'small': float(item['small']) if item['small'] else 0,
            'ice': float(item['ice']) if item['ice'] else 0
        }
        converted_items.append(converted_item)
    
    return converted_items

def get_todays_pool_data_optimized():
    try:
        dynamodb = get_dynamodb_resource()
        table = dynamodb.Table('poolStats')
        
        pl = pytz.timezone('Europe/Warsaw')
        now = datetime.now().astimezone(pl)
        today_start = datetime(now.year, now.month, now.day, 6)
        today_end = today_start + timedelta(days=1)
        
        today_start_str = today_start.strftime('%Y-%m-%d %H:%M:%S')
        today_end_str = today_end.strftime('%Y-%m-%d %H:%M:%S')
        today_date_only = today_start.strftime('%Y-%m-%d')
        
        response = table.query(
            IndexName='datetime-only-index',
            KeyConditionExpression='date_only = :date and #dt BETWEEN :start AND :end',
            ExpressionAttributeNames={'#dt': 'datetime'},
            ExpressionAttributeValues={
                ':date': today_date_only,
                ':start': today_start_str,
                ':end': today_end_str
            }
        )
        
        items = response.get('Items', [])
        items.sort(key=lambda x: x['datetime'])
        return items
        
    except Exception as e:
        print(f"Błąd podczas query: {str(e)}")
        return []

def content_view(request):
    # Pobierz dane z poolStatsHistory (pozostaje MySQL)
    # TODO: do one sql query and fetch data to live view
    # with connection.cursor() as cursor:
    #     sql_query = f"SELECT weekday, time, sport, family, small, ice FROM poolStats_history ORDER BY `poolStats_history`.`time` ASC"
    #     cursor.execute(sql_query)
    #     fulldata = cursor.fetchall()
    #     cache.set('fulldata', fulldata)
    
    fulldata = []
    weekday = datetime.today().weekday()
    stats_chart = stats_view(request, weekday)
    
    # Pobierz dzisiejsze dane z DynamoDB zamiast MySQL
    todays_pool_data = get_todays_pool_data_optimized()
    
    if not todays_pool_data:
        # Brak danych z dzisiejszego dnia
        return render(request, 'content.html', {
            'weather': get_weather_data(), 
            'lastdate': "Brak danych z bieżącego dnia.", 
            'sport': [0], 'family': [0], 'small': [0], 'ice': [0],
            'lastsport': "0", 'lastfamily': "0", 'lastsmall': "0", "lastice": "0",
            'sport_percent': "0", 'family_percent': "0", 'small_percent': "0", "ice_percent": "0"
        })
    
    # Konwertuj dane DynamoDB do formatu DataFrame
    converted_data = convert_dynamodb_to_dataframe(todays_pool_data)
    df = pd.DataFrame(converted_data, columns=['date', 'sport', 'family', 'small', 'ice'])

    # Konwersja datetime strings na pandas datetime z timezone
    tz = pytz.timezone('Europe/Warsaw')
    
    # Parsuj datetime strings z DynamoDB
    datetime_objects = []
    for date_str in df['date']:
        try:
            # Usuń mikrosekundy jeśli są obecne i parsuj
            date_clean = date_str.split('.')[0] if '.' in date_str else date_str
            dt = datetime.strptime(date_clean, '%Y-%m-%d %H:%M:%S')
            # Zakładając że datetime z DynamoDB jest w UTC lub lokalnym czasie
            dt_aware = tz.localize(dt) if dt.tzinfo is None else dt.astimezone(tz)
            datetime_objects.append(dt_aware)
        except ValueError as e:
            print(f"Błąd parsowania daty {date_str}: {e}")
            datetime_objects.append(datetime.now().astimezone(tz))
    
    date = pd.Series(datetime_objects)
    
    # Wyciągnij dane liczbowe
    sport = df['sport']
    family = df['family'] 
    small = df['small']
    ice = df['ice']

    # Ostatnie wartości
    last_sport = int(sport.iloc[-1])
    last_family = int(family.iloc[-1])
    last_small = int(small.iloc[-1])
    last_ice = int(ice.iloc[-1])

    # Oblicz procenty (te same limity co w oryginalnym kodzie)
    sport_percent = round((last_sport/105)*100)
    family_percent = round((last_family/150)*100)
    small_percent = round((last_small/30)*100)
    ice_percent = round((last_ice/300)*100)
    
    # Ostatnia data
    last_date = datetime_objects[-1].strftime('%d.%m.%Y %H:%M')
    
    return render(request, 'content.html', {
        'weather': get_weather_data(), 
        'ver_num': ver_num, 
        'stats_chart': stats_chart,
        'date': [dt.strftime('%Y-%m-%d %H:%M') for dt in datetime_objects],
        'sport': list(sport.astype(int)), 
        'family': list(family.astype(int)), 
        'small': list(small.astype(int)), 
        'ice': list(ice.astype(int)),
        'lastdate': last_date, 
        'lastsport': last_sport, 
        'lastfamily': last_family, 
        'lastsmall': last_small, 
        'lastice': last_ice, 
        'sport_percent': sport_percent, 
        'family_percent': family_percent, 
        'small_percent': small_percent, 
        'ice_percent': ice_percent, 
        'opening': days_until_opening()
    })

def stats_view(request, weekday):
    data = cache.get('fulldata')
    if True:
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

OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY')
CITY = 'Białystok,pl'
URL = f'https://api.openweathermap.org/data/2.5/weather?q={CITY}&appid={OPENWEATHER_API_KEY}&units=metric&lang=pl'

def get_weather_data():
    try:
        response = requests.get(URL)
        response.raise_for_status()
        data = response.json()
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
