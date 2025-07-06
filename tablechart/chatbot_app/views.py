from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import uuid
from .models import Conversation, Message
from .gemini_client import GeminiClient
from .langchain_utils import create_chain, generate_response
from django.shortcuts import render
from django.core.cache import cache
import pandas as pd

def chatbot_home(request):
    return render(request, 'chat_home.html')


@csrf_exempt
def chat_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            message = data.get('message', '')
            session_id = data.get('session_id')
            
            # Tworzenie lub pobieranie konwersacji
            if not session_id:
                session_id = str(uuid.uuid4())
                conversation, created = Conversation.objects.get_or_create(session_id=session_id)
            else:
                try:
                    conversation = Conversation.objects.get(session_id=session_id)
                except Conversation.DoesNotExist:
                    conversation = Conversation.objects.create(session_id=session_id)
            
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

            # Pobranie historii konwersacji
            history = conversation.messages.all()

            # Zapisanie wiadomości użytkownika
            Message.objects.create(
                conversation=conversation,
                role='user',
                content=message
            )
            
            # Generowanie odpowiedzi za pomocą LangChain i Gemini
            chain = create_chain(history=history, pool_data=pool_data_str)
            bot_response_text = generate_response(chain, message)

            # Zapisanie odpowiedzi bota
            Message.objects.create(
                conversation=conversation,
                role='bot',
                content=bot_response_text
            )
            
            # Aktualizacja czasu konwersacji
            conversation.save()
            
            return JsonResponse({
                'response': bot_response_text,
                'session_id': session_id
            })
        
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Invalid request method'}, status=400)
