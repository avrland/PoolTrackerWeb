# Quickstart: Wykres dnia z datepickerem, poprawka kafelka Aquapark i naprawa CSRF chatbota

**Feature**: `006-ui-datepicker-aquapark-csrf`  
**Date**: 2026-05-06

---

## Scenariusz 1: Użytkownik przegląda dane historyczne

**Warunki wstępne**: Aplikacja uruchomiona (`docker compose up`), baza zawiera dane z poprzednich dni.

1. Użytkownik otwiera `https://basen.bialystok.pl` → ładuje się React SPA.
2. `CurrentOccupancy` wykonuje GET `/api/current/` → Django ustawia ciasteczko `csrftoken` (dzięki `@ensure_csrf_cookie`).
3. `sessionId` trafia do Dashboard przez `onSessionId` callback.
4. `TodayChart` renderuje wykres dnia z etykietami HH:MM na osi X.
5. Użytkownik wybiera wczorajszą datę w datepickerze.
6. `TodayChart` wykonuje GET `/get_date_data/?date=YYYY-MM-DD` z nagłówkiem `X-Session-Key`.
7. Tytuł wykresu zmienia się na sformatowaną datę po polsku, przycisk „Dzisiaj" pojawia się.
8. Użytkownik klika „Dzisiaj" → wykres wraca do bieżącego dnia, używając danych już z cache (0 nowych żądań sieciowych).

---

## Scenariusz 2: Użytkownik sprawdza licznik Aquaparku

1. Użytkownik otwiera stronę → kafelek Aquapark pokazuje:
   - Tytuł: „Aquapark Andersa | Grudzień 2028"
   - Symbol: 🏗️
   - „Otwarcie za 953 dni" (klikalne, otwiera artykuł Lech w nowej karcie)
   - „12 godzin, 34 minut, 56 sekund" (zmienia się co sekundę)
2. Użytkownik klika na licznik godzin/minut/sekund → otwiera się `https://www.lech.net.pl/pl/aktualnosci/bedziemy-budowac-aquapark-w-bialymstoku-.html` w nowej karcie.

---

## Scenariusz 3: Użytkownik wysyła wiadomość do chatbota

1. Użytkownik otwiera stronę → GET `/api/current/` ustawia ciasteczko `csrftoken`.
2. Użytkownik otwiera panel chatbota i wpisuje pytanie.
3. `sendChatMessage()` odczytuje `csrftoken` z ciasteczka przez `getCsrfToken()`.
4. POST `/chatbot/api/chat/` zawiera nagłówek `X-CSRFToken: <token>`.
5. Django weryfikuje token → odpowiedź 200 z polem `response`.

**Przed naprawą**: Krok 1 nie ustawiał ciasteczka → krok 3 zwracał `null` → krok 5 zwracał 403 CSRF verification failed.

---

## Scenariusz 4: Wybrana data bez danych

1. Użytkownik wybiera datę sprzed wprowadzenia systemu monitoringu.
2. GET `/get_date_data/?date=2022-01-01` zwraca `{ "date": [], ... }`.
3. `TodayChart` wyświetla: „Brak danych z wybranego dnia." — bez crashu, bez pustego wykresu.

---

## Lokalne uruchomienie i testowanie

```bash
# Start full stack
docker compose up --build

# Run frontend unit tests
cd frontend
npm run test:run

# Verify CSRF cookie is set
curl -I http://localhost/api/current/
# Oczekiwane: Set-Cookie: csrftoken=...

# Verify date endpoint
curl "http://localhost/get_date_data/?date=2026-05-05" \
  -H "X-Session-Key: <session>" \
  --cookie "sessionid=<session_cookie>"
```

---

## Wpływ na istniejące testy

- `frontend/src/tests/` — testy TodayChart i CountdownCard wymagają aktualizacji prop interface'u i nowych assertions dla datepickera / licznika.
- Backend: istniejące testy `api_current_view` powinny nadal przechodzić; do dodania: asercja że `csrftoken` jest w nagłówkach odpowiedzi.
