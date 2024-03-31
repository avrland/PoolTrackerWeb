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

def content_view(request):
    #TODO do one sql query and fetch data to live view
    with connection.cursor() as cursor:
        sql_query = f"SELECT date, sport, family, small, ice FROM poolStats ORDER BY `poolStats`.`date` ASC"
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
                                                    'sport_percent': "0", 'family_percent': "0", 'small_percent': "0", "ice_percent": "0"})
    
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
    return render(request, 'content.html', {'stats_chart': stats_chart,
                                             'date': list(date.dt.strftime('%Y-%m-%d %H:%M')),
                                            'sport' : list(sport), 'family' : list(family), 'small': list(small), 'ice': list(ice),
                                            'lastdate': last_date, 'lastsport' : last_sport, 'lastfamily' : last_family, 
                                            'lastsmall': last_small, 'lastice': last_ice, 'sport_percent': sport_percent, 
                                            'family_percent': family_percent, 'small_percent': small_percent, 'ice_percent': ice_percent})

def stats_view(request, weekday):
    data = cache.get('fulldata')
    if len(data) == 0:
        stats_chart = render_to_string('stats_chart.html', {'date_stat': 0, 'sport_stat' : 0, 'family_stat' : 0, 'small_stat': 0})
        return stats_chart   
    pl = pytz.timezone('Europe/Warsaw')
    now = datetime.now().astimezone(pl)
    current_time = now.strftime("%H:%M")

    df = pd.DataFrame(data, columns=['date', 'sport', 'family', 'small', 'ice'])
    df['date'] = pd.to_datetime(df['date'])
    weekday_names = {0: "Poniedziałek", 1: "Wtorek", 2: "Środa", 3: "Czwartek", 4: "Piątek", 5: "Sobota", 6: "Niedziela"}
    df_weekly_mean = df.groupby([df["date"].dt.dayofweek.map(weekday_names), df["date"].dt.time])[["sport", "family", "small"]].mean().round()
    df_sunday = df_weekly_mean.loc[weekday_names[weekday]]
    df_sunday.index = pd.to_datetime(df_sunday.index.map(lambda t: datetime.combine(datetime.today(), t).strftime('%H:%M')), format='%H:%M')
    df_sunday = df_sunday.between_time("6:00", "22:00")

    time_sunday = df_sunday.index.tolist()
    time_sunday_formatted = [dt.strftime("%H:%M") for dt in time_sunday]
    df_sunday['time'] = time_sunday_formatted
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
    
    df = pd.DataFrame(data, columns=['date', 'sport', 'family', 'small', 'ice'])
    df['date'] = pd.to_datetime(df['date'])
    weekday_names = {0: "Poniedziałek", 1: "Wtorek", 2: "Środa", 3: "Czwartek", 4: "Piątek", 5: "Sobota", 6: "Niedziela"}
    # Map the day of the week integers to weekday names and group the data by weekday and time separately
    df_weekly_mean = df.groupby([df["date"].dt.dayofweek.map(weekday_names), df["date"].dt.time])[["sport", "family", "small"]].mean().round()
    df_sunday = df_weekly_mean.loc[weekday_names[day]]
    df_sunday.index = pd.to_datetime(df_sunday.index.map(lambda t: datetime.combine(datetime.today(), t).strftime('%H:%M')), format='%H:%M')
    df_sunday = df_sunday.between_time("6:00", "22:00")

    time_sunday = df_sunday.index.tolist()
    time_sunday_formatted = [dt.strftime("%H:%M") for dt in time_sunday]
    df_sunday['time'] = time_sunday_formatted
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