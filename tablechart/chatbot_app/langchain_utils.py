def history_to_text(messages):
    """Zamienia listę wiadomości na tekst do promptu. Zawsze zwraca string."""
    if not messages or not isinstance(messages, list):
        return ""
    lines = []
    for m in messages:
        # AIMessage/UserMessage w LangChain mają atrybut 'type' lub 'role'
        if hasattr(m, 'type') and m.type == 'ai':
            lines.append(f"Bot: {getattr(m, 'content', str(m))}")
        else:
            lines.append(f"Użytkownik: {getattr(m, 'content', str(m))}")
    return "\n".join(lines)
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from django.conf import settings
from pydantic import BaseModel, Field

class BotResponse(BaseModel):
    """Pydantic model for the bot's response."""
    reasoning: str = Field(description="Zastanów się o co chodziło uzytkownikowi")
    bot_response: str = Field(description="Odpowiedz bota dla uzytkownika ktora zostanie wprowadzona w czacie")

def create_chain(history=None, pool_data=""):
    """Tworzy pipeline konwersacyjny LangChain z Gemini, bez RunnableWithMessageHistory."""
    PROMPT_TEMPLATE = """Jesteś pomocnym asystentem AI o nazwie \"PoolBot\". Twoim zadaniem jest odpowiadanie na pytania dotyczące obłożenia basenów i lodowiska w kompleksie.
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

    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        temperature=0.3,
        google_api_key=settings.GEMINI_API_KEY
    ).with_structured_output(BotResponse)

    def run_chain(user_input, session_history=None):
        # Zamień historię na tekst
        history_text = history_to_text(session_history) if session_history else ""
        prompt_str = prompt.format(history=history_text, input=user_input)
        return llm.invoke(prompt_str)

    return run_chain

def generate_response(chain, prompt, session_history=None):
    """Generuje odpowiedź z pipeline'u LangChain (bez RunnableWithMessageHistory)"""
    response = chain(prompt, session_history)
    print(response)
    if isinstance(response, BotResponse):
        return response.bot_response
    if hasattr(response, 'content'):
        return response.content
    return str(response)
