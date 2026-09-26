# Interface Contract: wycofane i zachowane wejścia

## Wycofany chatbot

| Warstwa | Żądania | Oczekiwana odpowiedź |
|---|---|---|
| Publiczny Nginx | /chatbot oraz /chatbot/ i dowolna dalsza ścieżka; GET, HEAD, POST, OPTIONS | 410 Gone; brak proxy, brak operacji biznesowej |
| Bezpośredni Django | Te same ścieżki, w szczególności /chatbot/api/chat/ | 404, brak zarejestrowanej funkcji chatbota |
| Vite dev z działającym backendem | Ten sam prefiks | 404 przekazane przez wąskie proxy ochronne; nigdy 200 z index.html |

Dla Nginx treść odpowiedzi (poza HEAD): JSON z polem `error`:
„Ta funkcja została wycofana.”, Content-Type `application/json; charset=utf-8`,
Cache-Control `no-store`. Nie odbijać treści żądania, sesji ani danych użytkownika.
Bezpośrednie 404 Django pozostaje standardową odpowiedzią braku trasy, bez wymogu nowego widoku.
Przy braku backendu Vite może zwrócić błąd połączenia 5xx, ale nie sukces SPA.

W Nginx dokładne /chatbot i prefiks ^~ /chatbot/ muszą wyprzedzać obsługę SPA i regex
zasobów statycznych; sprawdzić także /chatbot/old.js oraz parametry query.
Zabezpieczenie to jest celowo zachowanym śladem wycofania.
Nie zmieniać zachowania niezwiązanych adresów, np. /chatbot-other.

Stary klient może przesłać zapisany token lub treść wiadomości; w żadnym przypadku
nie wolno zapisać wiadomości, pobrać archiwum ani wywołać dostawcy modelu.
Testy muszą przejść z dawnymi ustawieniami środowiska obecnymi i nieobecnymi.

## Darowizny i wyłączanie reklam

W bieżącym routingu nie znaleziono dedykowanych punktów wejścia tych funkcji.
Usunąć ustawienia i przykładową konfigurację: DONATION_LIST_PATH, GODMODE_EMAIL,
BUYCOFFEE_URL; chatbot dodatkowo GEMINI_API_KEY.
Nie tworzyć fikcyjnych tras ani nowych ekranów zastępczych.
Jeżeli implementacja odkryje rzeczywistą dawną trasę, objąć ją kontraktem niedostępności
i dodać konkretny przypadek regresyjny przed usunięciem.

## Zachowane kontrakty

| Wejście | Wymagane zachowanie |
|---|---|
| GET /api/current/ | Ten sam format pomiarów i session_id, istniejące cookie sesji i CSRF |
| GET /api/available-dates/ | Ten sam zbiór dostępnych dat |
| GET /get_date_data/?date=YYYY-MM-DD | Zachowana walidacja daty, sesji oraz X-Session-Key; te same dane |
| GET /update_chart/stats{day} | Ten sam wybór dnia i średnie |
| GET /api/weather/ | Dotychczasowy kontrakt danych i błędów; nie usuwać OPENWEATHER_API_KEY |
| / oraz /pool/:id | Aktualne widoki, nawigacja, oba motywy, brak elementów wycofanych funkcji |

Przed usuwaniem prywatnego getCsrfToken z klienta sprawdzić, że używa go wyłącznie
sendChatMessage. Middleware CSRF, sesje i ensure_csrf_cookie w aktywnym backendzie pozostają.

## Archiwum i wydanie

Brak nowego interfejsu archiwum. Żaden aktywny endpoint nie udostępnia rozmów,
list darczyńców ani manifestu zachowania danych.
Instalacja czysta nie wymaga starych danych; aktualizacja istniejąca ich nie kasuje.

Rollback przywraca działające funkcje basenowe, lecz musi zachować blokadę wycofanych
wejść także przy bezpośrednim dostępie do backendu. Nie wystarcza powrót całego starego
obrazu i konfiguracji: użyć przygotowanego obrazu naprawczego ze starym kodem basenowym,
ale nadal bez rejestracji tras chatbota i bez jego aktywnych poświadczeń.
Ponownie przetestować kontrakt przed dopuszczeniem ruchu.

