from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from django.conf import settings
from pydantic import BaseModel, Field

class BotResponse(BaseModel):
    """Pydantic model for the bot's response."""
    reasoning: str = Field(description="Zastanów się o co chodziło uzytkownikowi")
    bot_response: str = Field(description="Odpowiedz bota dla uzytkownika ktora zostanie wprowadzona w czacie")

def create_chain(history=None, pool_data=""):
    """Tworzy łańcuch konwersacyjny LangChain z Gemini, uwzględniając dane o basenach."""
    
    # Szablon promptu, który instruuje LLM i dostarcza dane
    PROMPT_TEMPLATE = """Jesteś pomocnym asystentem AI o nazwie "PoolBot". Twoim zadaniem jest odpowiadanie na pytania dotyczące obłożenia basenów i lodowiska w kompleksie.
Twoja rola to dostarczanie informacji na podstawie poniższych danych. Bądź miły, pomocny i rozmawiaj naturalnie.
Odpowiadaj zawsze w języku polskim.

Oto dane o średnim obłożeniu (liczba osób) w zależności od dnia tygodnia i godziny.
Nazwy to: 'sport' (basen sportowy), 'family' (basen rodzinny), 'small' (basen kameralny), 'ice' (lodowisko).
---
{pool_data}
---

Poniżej znajduje się historia dotychczasowej rozmowy. Wykorzystaj ją, aby zrozumieć kontekst pytania.

Historia konwersacji:
{history}

Użytkownik: {input}
"""

    prompt = PromptTemplate(
        input_variables=["history", "input"],
        partial_variables={"pool_data": pool_data},
        template=PROMPT_TEMPLATE
    )

    # Inicjalizacja modelu Gemini
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        temperature=0.3,
        google_api_key=settings.GEMINI_API_KEY
    )
    # Removed with_structured_output wrapping to avoid passing BotResponse objects internally
    
    # Tworzenie pamięci konwersacji
    memory = ConversationBufferMemory(memory_key="history")
    if history:
        for message in history:
            if message.role == 'user':
                memory.chat_memory.add_user_message(message.content)
            elif message.role == 'bot':
                # The content can be a JSON string, which is fine.
                memory.chat_memory.add_ai_message(message.content)
    
    # Tworzenie łańcucha konwersacyjnego
    conversation_chain = ConversationChain(
        llm=llm,
        prompt=prompt,
        memory=memory,
        verbose=True
    )
    
    return conversation_chain

def generate_response(chain, prompt):
    """Generuje odpowiedź z łańcucha LangChain"""
    raw_response = chain.predict(input=prompt)
    try:
        # Parse raw string response into BotResponse model
        parsed_response = BotResponse.model_validate_json(raw_response)
        return parsed_response.bot_response
    except Exception as e:
        # Fallback: return raw response if parsing fails
        return raw_response
