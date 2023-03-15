from django.views import View
from django.shortcuts import render
from django.db import connection
import datetime
import plotly.express as px
import pandas as pd
from django.http import JsonResponse

def content_view(request):
    now = datetime.datetime.now()
    today = datetime.datetime(now.year, now.month, now.day, 6)
  
    with connection.cursor() as cursor:
        sql_query = f"SELECT date, sport, family, small, ice FROM poolStats WHERE date >= '{today}' ORDER BY `poolStats`.`date` ASC"
        cursor.execute(sql_query)
        data = cursor.fetchall()
    
    if len(data) == 0:
            return render(request, 'content.html', {'lastdate': "Brak danych z dzisiaj, wróć po 6:00.", 'lastsport' : "0", 'lastfamily' : "0", 'lastsmall': "0",
                                          'sport_percent': "0", 'family_percent': "0", 'small_percent': "0"})
    
    df = pd.DataFrame(data, columns=['date', 'sport', 'family', 'small', 'ice'])
    date = pd.to_datetime(df['date']) + pd.Timedelta(hours=1)
    sport = df['sport']
    family = df['family']
    small = df['small']

    last_sport = sport.iloc[-1]
    last_family = family.iloc[-1]
    last_small = small.iloc[-1]

    sport_percent = round((last_sport/105)*100)
    family_percent = round((last_family/150)*100)
    small_percent = round((last_small/30)*100)
    last_date = df['date'].iloc[-1].strftime('%d.%m.%Y %H:%M')
    return render(request, 'content.html', {'date': list(date.dt.strftime('%Y-%m-%d %H:%M')), 'sport' : list(sport), 'family' : list(family), 'small': list(small),
                                          'lastdate': last_date, 'lastsport' : last_sport, 'lastfamily' : last_family, 'lastsmall': last_small,
                                          'sport_percent': sport_percent, 'family_percent': family_percent, 'small_percent': small_percent})

def update_chart(request):
    now = datetime.datetime.now()
    last_24h = now - datetime.timedelta(hours=6)

    with connection.cursor() as cursor:
        sql_query = f"SELECT date, sport, family, small, ice FROM poolStats WHERE date >= '{last_24h}' ORDER BY `poolStats`.`date` ASC"
        cursor.execute(sql_query)
        data = cursor.fetchall()
    df = pd.DataFrame(data, columns=['date', 'sport', 'family', 'small', 'ice'])
    date = pd.to_datetime(df['date']) + pd.Timedelta(hours=1)
    sport = df['sport']
    family = df['family']
    small = df['small']

    last_date = df['date'].iloc[-1].strftime('%d.%m.%Y %H:%M')
    response_data = {'date': list(date.dt.strftime('%Y-%m-%d %H:%M')), 'sport' : list(map(int, sport)), 'family' : list(map(int, family)), 'small': list(map(int, small))}
    return JsonResponse(response_data)
