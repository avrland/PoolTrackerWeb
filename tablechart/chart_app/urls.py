from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('', views.live_chart_view),
    path('update_chart/', views.update_chart)
]
