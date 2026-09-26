# Removal Inventory: zakres implementacji

Wykaz zamknięty po implementacji 2026-09-26. Wszystkie pozycje „usunąć” poniżej
wykonano; konfigurację i dokumentację zmieniono zgodnie z ograniczeniami.
Dowody: [../validation.md](../validation.md), testy runtime/HTTP/archiwum i diff.

- Katalogi makiet, aplikacja chatbota, widgety i prywatne funkcje API: usunięte.
- Rejestracja, routing, pięć zależności i cztery ustawienia: usunięte.
- `tablechart/.env example` jest śledzonym przykładem: usunięto wyłącznie cztery
  wycofane wpisy bez wyświetlania wartości; `.env*` wykluczono z obrazu.
- Nginx: 410; Vite: wąskie proxy do 404 i przekazanie OPTIONS, potwierdzone HTTP.
- README i ignorowanie archiwów: zaktualizowane, test pakowania przeszedł.
- Dodatkowo poprawiono aktywną listę technologii w
  `.github/agents/copilot-instructions.md`; historyczny wpis 001 pozostaje historią.
- Zachowane poniżej elementy: bez zmian. Prywatnych danych nie odczytywano ani nie usuwano.

| Element | Decyzja | Ograniczenie |
|---|---|---|
| rework/, darkmode/ | Usunąć całe katalogi makiet | Zweryfikować absolutne granice; aktywne motywy poza zakresem usunięcia |
| tablechart/chatbot_app/ | Usunąć cały kod, migrację i testy-szablony | Nie uruchamiać migracji wstecz i nie usuwać danych |
| tablechart/tablechart/settings.py | Usunąć chatbot_app oraz GEMINI_API_KEY, DONATION_LIST_PATH, GODMODE_EMAIL, BUYCOFFEE_URL | Zachować ochronę sesji/CSRF i pogodę |
| tablechart/tablechart/urls.py | Usunąć include chatbot_app | Dawny backendowy adres daje 404 |
| frontend/src/components/ChatbotWidget.jsx | Usunąć | Brak powiązań z aktywnymi stronami potwierdzić ponownie |
| frontend/src/services/api.js | Usunąć sendChatMessage i wyłącznie przez nią używany getCsrfToken | Zachować pozostałe funkcje fetch |
| tablechart/static/assets/js/chatbot-widget.js | Usunąć | Odwołania i stare buildy sprawdzić |
| tablechart/static/assets/css/chatbot-widget.css | Usunąć | Nie kasować wspólnych styli |
| frontend/nginx.conf | Zastąpić chatbot proxy jawnym 410 | Exact + ^~ prefix; brak SPA fallback i provider calls |
| frontend/vite.config.js | Zachować wąski forwarding jako kontrolowane odrzucanie 404 przez backend; zmienić opis | Uzasadniony wyjątek, test przeciw 200 SPA |
| tablechart/requirements.txt | Usunąć langchain, langchain-google-genai, pydantic, bleach, qdrant-client | Ponownie sprawdzić importy; bez zbiorczego upgrade zależności |
| .env.example, tablechart/.env.example | Usunąć cztery wycofane nazwy ustawień | Nie przepisywać prywatnych plików .env |
| tablechart/.env example | Zweryfikować nietypowy historyczny plik; usunąć wycofane wpisy jeśli jest utrzymywanym przykładem | Bez wyświetlania wartości; prywatny plik zachować poza obrazem i udokumentować wyjątek |
| README.md | Usunąć instrukcje chatbota/darczyńców; aktualizować aktywną strukturę i procedurę archiwum | Historyczne specs pozostają |
| tablechart/.dockerignore | Wykluczyć donors.json, logs/, archiwa i nietypowe pliki środowiskowe z obrazu | Nie usuwać odpowiadających plików użytkownika |
| .gitignore | Zachować ochronę danych; uzupełnić tylko brakujące wzorce archiwów | Nazwy wycofanych funkcji w ochronie archiwum są dopuszczalne |

## Jawnie zachowane

- `frontend/src/contexts/ThemeContext.jsx`, `DarkModeToggle.jsx`, theme CSS, fonty i licencje.
- `django-ratelimit`, pandas, requests, pytz, sesje, middleware CSRF i ensure_csrf_cookie.
- `poolStats`, `poolstats_history`, postgres_data, logs_data, backups/, konfiguracja backupu.
- Nieaktywne tabele chatbota, dawne migration records i ewentualne content types/uprawnienia.
- Pliki darczyńców/historii i dawne dane przeglądarki; ich kasowanie nie jest autoryzowane.
- Historyczne specyfikacje, historia Git i vendorowe ikony/napisy „donate”.
- Inne legacy i niezależne integracje reklamowe, jeżeli nie należą do wycofywanej funkcji.

## Kontrola kompletności

Przeszukać utrzymywany kod, konfigurację, źródłowe zasoby i dokumentację dla:
chatbot, langchain, gemini, qdrant, donor, donation, GODMODE_EMAIL, BUYCOFFEE_URL,
ad_free, ad-free, rework i darkmode. Wykluczyć prywatne .env, archiwa, dumpy,
wygenerowane/vendorowe pliki i historię Git z przeszukiwania treści.
Każdy wynik sklasyfikować; nie wymagać mechanicznego zera wystąpień.

Przykładowe nazwy testów do utworzenia: `frontend/src/tests/Retirement.test.jsx`,
przypadki backendowe w `tablechart/chart_app/tests.py`.
Lokalne raporty nie mogą zawierać sekretów ani treści danych archiwalnych.

