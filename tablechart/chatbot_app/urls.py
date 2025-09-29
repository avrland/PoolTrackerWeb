from django.urls import path
from . import views

app_name = 'chatbot_app'

urlpatterns = [
    path('api/chat/', views.chat_view, name='chat_api'),
    path('', views.chatbot_home, name='chatbot_home'),  # dodaj tę linię
]