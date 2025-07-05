from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import uuid
from .models import Conversation, Message
from .gemini_client import GeminiClient
from .langchain_utils import create_chain, generate_response
from django.shortcuts import render

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
            
            # Zapisanie wiadomości użytkownika
            Message.objects.create(
                conversation=conversation,
                role='user',
                content=message
            )
            
            # Generowanie odpowiedzi za pomocą LangChain i Gemini
            chain = create_chain()
            bot_response = generate_response(chain, message)
            
            # Zapisanie odpowiedzi bota
            Message.objects.create(
                conversation=conversation,
                role='bot',
                content=bot_response
            )
            
            # Aktualizacja czasu konwersacji
            conversation.save()
            
            return JsonResponse({
                'response': bot_response,
                'session_id': session_id
            })
        
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Invalid request method'}, status=400)