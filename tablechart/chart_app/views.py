from django.views import View
from django.shortcuts import render
from django.db import connection
import datetime
import plotly.express as px
import pandas as pd
from django.http import JsonResponse

def myview(request):
    now = datetime.datetime.now()
    last_24h = now - datetime.timedelta(hours=12)

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
    return render(request, 'dashboard.html', {'date': list(date.dt.strftime('%Y-%m-%d %H:%M')), 'sport' : list(sport), 'family' : list(family), 'small': list(small),
                                          'lastdate': last_date, 'lastsport' : sport.iloc[-1], 'lastfamily' : family.iloc[-1], 'lastsmall': small.iloc[-1]})

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
