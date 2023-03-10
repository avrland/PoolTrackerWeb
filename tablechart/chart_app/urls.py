from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('', views.myview),
    path('update_chart/', views.update_chart)
]
