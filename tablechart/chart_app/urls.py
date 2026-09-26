from django.urls import path
from . import views

urlpatterns = [
    path('update_chart/stats<int:day>', views.update_chart),
    path('get_date_data/', views.get_date_data, name='get_date_data'),
    path('api/available-dates/', views.api_available_dates_view, name='api_available_dates'),
    path('api/current/', views.api_current_view, name='api_current'),
    path('api/weather/', views.api_weather_view, name='api_weather'),
]
