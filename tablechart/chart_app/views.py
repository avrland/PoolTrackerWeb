from django.views import View
from django.shortcuts import render
from django.db import connection
import datetime
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import plotly.express as px
import io
import urllib, base64
import pandas as pd

# Define the SQL query to fetch data from the database
def myview(request):
    now = datetime.datetime.now()
    last_24h = now - datetime.timedelta(hours=48)

    with connection.cursor() as cursor:
        sql_query = f"SELECT date, sport, family, small, ice FROM poolStats WHERE date >= '{last_24h}' ORDER BY `poolStats`.`date` ASC"
        cursor.execute(sql_query)
        data = cursor.fetchall()
    df = pd.DataFrame(data, columns=['date', 'sport', 'family', 'small', 'ice'])
    date = df['date']
    sport = df['sport']
    family = df['family']
    small = df['small']
    ice = df['ice'] 
    fig = px.line(df, x=date, y=[sport, family, small, ice])
    fig.update_layout(title="Stan zajętości obiektów BOSiR (ostatnie 48h)", xaxis_title="Czas", yaxis_title="Liczba osób")
    #fig.update_traces(text=["Sportowa", "Rodzinna", "Kameralna", "Lodowisko"])

    last_date = df['date'].iloc[-1].strftime('%d.%m.%Y %H:%M')
    return render(request, 'chart.html', {'plot': fig.to_html(full_html=False), 'date': last_date, 'sport' : sport.iloc[-1], 'family' : family.iloc[-1], 'small': small.iloc[-1], "ice" : ice.iloc[-1]})