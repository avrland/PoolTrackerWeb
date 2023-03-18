from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('', views.content_view),
    path('update_chart/stats<int:day>', views.update_chart)
]
