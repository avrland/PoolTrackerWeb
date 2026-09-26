# API Contracts: Wykres dnia z datepickerem, poprawka kafelka Aquapark i naprawa CSRF chatbota

**Feature**: `006-ui-datepicker-aquapark-csrf`  
**Date**: 2026-05-06

---

## Istniejące endpointy (bez zmian w odpowiedzi, zmiany tylko w dekoratorach)

### GET /api/current/

**Zmiana**: Dodanie `@ensure_csrf_cookie` — Django doda nagłówek `Set-Cookie: csrftoken=...` do odpowiedzi.

**Request**:
```
GET /api/current/
credentials: include
```

**Response** (istniejąca — bez zmian):
```json
{
  "date": ["2026-05-06 08:00", "2026-05-06 08:30"],
  "sport": [12, 15],
  "family": [8, 10],
  "small": [3, 4],
  "ice": [0, 0],
  "lastdate": "06.05.2026 08:30",
  "lastsport": 15,
  "lastfamily": 10,
  "lastsmall": 4,
  "lastice": 0,
  "sport_percent": 14,
  "family_percent": 7,
  "small_percent": 13,
  "ice_percent": 0,
  "session_id": "abc123xyz",
  "opening": 953
}
```

**Headers dodawane przez `@ensure_csrf_cookie`**:
```
Set-Cookie: csrftoken=<token>; Path=/; SameSite=Lax
```

---

### GET /get_date_data/?date=YYYY-MM-DD

**Zmiana**: Brak zmian w API. Już zaimplementowany. Wywoływany z frontendu z nagłówkiem `X-Session-Key`.

**Request**:
```
GET /get_date_data/?date=2026-05-03
credentials: include
headers:
  X-Session-Key: <session_id>
```

**Response — dane dostępne**:
```json
{
  "date": ["2026-05-03 08:00", "2026-05-03 08:30", "..."],
  "sport": [5, 8],
  "family": [2, 4],
  "small": [1, 2],
  "ice": [0, 0],
  "lastdate": "03.05.2026 20:30",
  "display_date": "03.05.2026"
}
```

**Response — brak danych dla daty**:
```json
{
  "error": "Brak danych dla wybranej daty.",
  "date": [],
  "sport": [],
  "family": [],
  "small": [],
  "ice": [],
  "lastdate": "Brak danych",
  "display_date": "03.05.2026"
}
```

**Response — błąd autoryzacji (401/403)**:
```json
{ "error": "Brak autoryzacji" }
```

---

## Kontrakty UI — komponenty frontendowe

### TodayChart — props

```typescript
interface TodayChartProps {
  sessionId: string | null   // ID sesji z fetchCurrentData; null przed załadowaniem
}
```

### CountdownCard — brak propów

Komponent nie posiada propów. Wszystkie dane są obliczane lokalnie.

---

## Testy kontraktowe (warunki akceptacji)

### Backend

| Test | Warunek | Oczekiwany wynik |
|------|---------|-----------------|
| CSRF cookie na GET /api/current/ | Wysłanie GET bez ciasteczka | Odpowiedź 200 zawiera `Set-Cookie: csrftoken=...` |
| Brak zmiany odpowiedzi JSON | GET /api/current/ po dodaniu @ensure_csrf_cookie | JSON identyczny jak przed zmianą |
| POST /chatbot/api/chat/ po GET /api/current/ | Nowa sesja, pierwsza wiadomość | Odpowiedź 200 z polem `response` |

### Frontend

| Test | Warunek | Oczekiwany wynik |
|------|---------|-----------------|
| Tooltip x-axis | Najechanie na punkt wykresu | Wyświetla "HH:MM" zamiast liczby porządkowej |
| Datepicker default | Renderowanie TodayChart | Datepicker zawiera dzisiejszą datę |
| Tytuł dziś | selectedDate == today | Tytuł wykresu: "Dzisiaj" |
| Tytuł historyczny | selectedDate != today | Tytuł wykresu: sformatowana data po polsku |
| Przycisk Dzisiaj | selectedDate == today | Przycisk "Dzisiaj" niewidoczny |
| Przycisk Dzisiaj | selectedDate != today | Przycisk "Dzisiaj" widoczny |
| Puste dane | API zwraca date: [] | Wyświetla "Brak danych z wybranego dnia" |
| Aquapark tytuł | Renderowanie CountdownCard | Tekst "Aquapark Andersa" i "Grudzień 2028" widoczny |
| Aquapark symbol | Renderowanie CountdownCard | Emoji 🏗️ widoczny |
| Aquapark link | Kliknięcie licznika | Otwiera https://www.lech.net.pl/pl/aktualnosci/bedziemy-budowac-aquapark-w-bialymstoku-.html |
| Aquapark odliczanie | Odczekanie 2 sekund | Sekundy w liczniku zmieniają się |
