from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django_ratelimit.decorators import ratelimit
import json
import uuid
from .langchain_utils import create_conversational_chain
from django.shortcuts import render
from django.core.cache import cache
import pandas as pd
import os
import csv
from datetime import datetime
import bleach
import re


def save_chat_history(session_id, user_message, bot_response):
    """Saves a chat message to the history CSV file."""
    history_dir = 'logs'
    os.makedirs(history_dir, exist_ok=True)
    history_file = os.path.join(history_dir, 'chat_history.csv')
    
    file_exists = os.path.isfile(history_file)
    
    with open(history_file, 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, delimiter=';')
        if not file_exists:
            writer.writerow(['datetime', 'session_id', 'prompt', 'response'])
        
        writer.writerow([
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            session_id,
            user_message,
            str(bot_response)
        ])


def chatbot_home(request):
    return render(request, 'chat_home.html')


def sanitize_message(message):
    """
    Sanitize user input to prevent XSS and prompt injection attacks.
    
    Args:
        message: User input string
        
    Returns:
        Sanitized string safe for processing
    """
    # Remove HTML tags
    message = bleach.clean(message, tags=[], strip=True)
    
    # Remove potential prompt injection patterns
    dangerous_patterns = [
        r'<\|.*?\|>',  # Special tokens
        r'\[INST\]|\[/INST\]',  # Instruction markers
        r'###.*?###',  # System prompts
        r'\b(?:SYSTEM|ASSISTANT|USER)\s*:',  # Role markers with optional whitespace
    ]
    
    for pattern in dangerous_patterns:
        message = re.sub(pattern, '', message, flags=re.IGNORECASE)
    
    # Remove excessive whitespace
    message = ' '.join(message.split())
    
    return message.strip()


def get_session_key(group, request):
    """Custom key function for session-based rate limiting"""
    return request.session.session_key or request.META.get('REMOTE_ADDR')


@require_http_methods(["POST"])
@ratelimit(key='ip', rate='20/m', method='POST', block=True)
@ratelimit(key=get_session_key, rate='30/m', method='POST', block=True)
def chat_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            message = data.get('message', '')
            session_id = request.session.session_key
            if not session_id:
                request.session.save()
                session_id = request.session.session_key

            # Sanitize input to prevent XSS and prompt injection
            message = sanitize_message(message)

            # Validate message length (after sanitization)
            if not message or len(message.strip()) == 0:
                return JsonResponse({'error': 'Wiadomość nie może być pusta'}, status=400)
            
            # Enforce max message length 250
            if len(message) > 250:
                message = message[:250]

            # Pobranie danych o basenach z cache
            pool_data_raw = cache.get('fulldata')
            pool_data_str = ""
            if pool_data_raw:
                # Konwersja danych na format tekstowy
                df = pd.DataFrame(pool_data_raw, columns=['weekday', 'time', 'sport', 'family', 'small', 'ice'])
                df['time'] = df['time'].apply(lambda x: x.strftime('%H:%M'))
                
                # Zmiana nazw dni tygodnia na polskie
                weekday_map = {
                    "Monday": "Poniedziałek", "Tuesday": "Wtorek", "Wednesday": "Środa",
                    "Thursday": "Czwartek", "Friday": "Piątek", "Saturday": "Sobota", "Sunday": "Niedziela"
                }
                df['weekday'] = df['weekday'].map(weekday_map)
                
                pool_data_str = df.to_string()
            else:
                # Informacja dla użytkownika, jeśli dane nie są dostępne
                return JsonResponse({
                    'response': 'Przepraszam, dane o obłożeniu basenów nie są w tej chwili dostępne. Odwiedź najpierw stronę główną, aby je załadować.',
                    'session_id': session_id
                })

            # Utworzenie i wywołanie łańcucha konwersacyjnego
            chain = create_conversational_chain(pool_data=pool_data_str)
            config = {"configurable": {"session_id": session_id}}
            bot_response_text = chain.invoke({"input": message}, config=config)

            # Zapis historii czatu
            try:
                save_chat_history(session_id, message, bot_response_text)
            except Exception as e:
                # Log the error but don't prevent the user from getting a response
                print(f"Error saving chat history: {e}")

            return JsonResponse({
                'response': bot_response_text,
                'session_id': session_id
            })
        
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Invalid request method'}, status=400)
