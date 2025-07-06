from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from django.conf import settings

def create_chain(history=None):
    """Tworzy łańcuch konwersacyjny LangChain z Gemini"""
    # Inicjalizacja modelu Gemini
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.7,
        google_api_key=settings.GEMINI_API_KEY
    )
    
    # Tworzenie pamięci konwersacji
    memory = ConversationBufferMemory()
    if history:
        for message in history:
            if message.role == 'user':
                memory.chat_memory.add_user_message(message.content)
            elif message.role == 'bot':
                memory.chat_memory.add_ai_message(message.content)
    
    # Tworzenie łańcucha konwersacyjnego
    conversation_chain = ConversationChain(
        llm=llm,
        memory=memory,
        verbose=True
    )
    
    return conversation_chain

def generate_response(chain, prompt):
    """Generuje odpowiedź z łańcucha LangChain"""
    return chain.predict(input=prompt)
