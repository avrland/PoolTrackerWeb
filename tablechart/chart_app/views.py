from django.views import View
from django.shortcuts import render
from django.db import connection
import datetime
import plotly.express as px
import pandas as pd
from django.http import JsonResponse
from django.template.loader import render_to_string
from datetime import datetime

def content_view(request):
    stats_chart = stats_view(request)
    now = datetime.now()
    today = datetime(now.year, now.month, now.day, 6)
  
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
    return render(request, 'content.html', {'stats_chart': stats_chart, 'date': list(date.dt.strftime('%Y-%m-%d %H:%M')), 'sport' : list(sport), 'family' : list(family), 'small': list(small),
                                          'lastdate': last_date, 'lastsport' : last_sport, 'lastfamily' : last_family, 'lastsmall': last_small,
                                          'sport_percent': sport_percent, 'family_percent': family_percent, 'small_percent': small_percent})

def stats_view(request):
    with connection.cursor() as cursor:
        sql_query = f"SELECT date, sport, family, small FROM poolStats ORDER BY `poolStats`.`date` ASC"
        cursor.execute(sql_query)
        data = cursor.fetchall()
    
    if len(data) == 0:
        stats_chart = render_to_string('stats_chart.html', {'date_stat': 0, 'sport_stat' : 0, 'family_stat' : 0, 'small_stat': 0})
        return stats_chart
    
    df = pd.DataFrame(data, columns=['date', 'sport', 'family', 'small'])
    df['date'] = pd.to_datetime(df['date'])
    weekday_names = {0: "Monday", 1: "Tuesday", 2: "Wednesday", 3: "Thursday", 4: "Friday", 5: "Saturday", 6: "Sunday"}
    # Map the day of the week integers to weekday names and group the data by weekday and time separately
    df_weekly_mean = df.groupby([df["date"].dt.dayofweek.map(weekday_names), df["date"].dt.time])["sport", "family", "small"].mean().round()
    df_sunday = df_weekly_mean.loc["Sunday"]
    df_sunday.index = pd.to_datetime(df_sunday.index.map(lambda t: datetime.combine(datetime.today(), t).strftime('%H:%M')))
    df_sunday = df_sunday.between_time("6:00", "22:00")

    time_sunday = df_sunday.index.tolist()
    time_sunday_formatted = [dt.strftime("%H:%M") for dt in time_sunday]
    df_sunday['time'] = time_sunday_formatted
    sport = df_sunday['sport']
    family = df_sunday['family']
    small = df_sunday['small']
    stats_chart = render_to_string('stats_chart.html', {'date_stat': time_sunday_formatted, 'sport_stat' : list(sport), 'family_stat' : list(family), 'small_stat': list(small)})
    return stats_chart



def update_chart(request):
    now = datetime.now()
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
