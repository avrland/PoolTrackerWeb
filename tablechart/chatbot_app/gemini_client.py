import google.generativeai as genai
from django.conf import settings

class GeminiClient:
    def __init__(self, api_key=None, model_name="gemini-2.5-flash"):
        """Inicjalizacja klienta Gemini Flash 2.5"""
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(self.model_name)
    
    def get_response(self, prompt, history=None):
        """Generuje odpowiedź od modelu Gemini"""
        if history:
            chat = self.model.start_chat(history=history)
            response = chat.send_message(prompt)
        else:
            response = self.model.generate_content(prompt)
        
        return response.text
