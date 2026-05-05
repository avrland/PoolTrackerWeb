# API Endpoints Contract: PoolTracker React Frontend

**Feature**: 003-react-frontend  
**Date**: 2026-05-05

Definiuje kontrakt interfejsu pomiędzy frontendem React a backendem Django. Django jest jedynym dostawcą danych. Nginx pełni rolę reverse proxy — React nigdy nie komunikuje się bezpośrednio z Django poza środowiskiem dev.

---

## Base URL

| Środowisko | Base URL React → API |
|------------|----------------------|
| Produkcja | `/` (same-origin, przez nginx) |
| Dev (Vite) | `http://localhost:8000` (CORS aktywny w Django gdy `DEBUG=True`) |

---

## Endpoint 1: Bieżące dane — NOWY

```
GET /api/current/
```

**Opis**: Zwraca bieżące dane obłożenia basenów dla dzisiejszego dnia od godz. 6:00 do teraz. Tworzy sesję Django jeśli nie istnieje.

**Uwierzytelnienie**: Brak (publiczny). Tworzy/aktualizuje session cookie.

**Nagłówki żądania**: Brak wymaganych.

**Odpowiedź 200 OK — dane dostępne**:
```json
{
  "date": ["2026-05-05 09:00", "2026-05-05 09:15"],
  "sport": [42, 45],
  "family": [80, 83],
  "small": [15, 16],
  "ice": [120, 125],
  "lastdate": "05.05.2026 09:15",
  "lastsport": 45,
  "lastfamily": 83,
  "lastsmall": 16,
  "lastice": 125,
  "sport_percent": 43,
  "family_percent": 55,
  "small_percent": 53,
  "ice_percent": 42,
  "session_id": "abc123xyz456",
  "opening": null
}
```

**Odpowiedź 200 OK — brak danych z dnia**:
```json
{
  "date": [],
  "sport": [],
  "family": [],
  "small": [],
  "ice": [],
  "lastdate": "Brak danych z bieżącego dnia.",
  "lastsport": 0,
  "lastfamily": 0,
  "lastsmall": 0,
  "lastice": 0,
  "sport_percent": 0,
  "family_percent": 0,
  "small_percent": 0,
  "ice_percent": 0,
  "session_id": "abc123xyz456",
  "opening": "10.09.2026"
}
```

**Metoda HTTP**: `GET`  
**Cache**: Nie cachować — dane real-time  
**Polling**: React odpytuje co 5 minut (TanStack Query `staleTime: 5*60*1000`)

---

## Endpoint 2: Dane historyczne według dnia — ISTNIEJĄCY (bez zmian)

```
GET /update_chart/stats<int:day>
```

**Opis**: Zwraca uśrednione dane historyczne obłożenia basenów dla podanego dnia tygodnia.

**Parametr URL**: `day` — liczba całkowita 0–6 (0 = Poniedziałek, 6 = Niedziela)

**Uwierzytelnienie**: Brak (publiczny).

**Odpowiedź 200 OK**:
```json
{
  "today": "Poniedziałek",
  "date_stat": ["06:00", "06:15", "06:30"],
  "sport_stat": [10, 12, 15],
  "family_stat": [20, 22, 25],
  "small_stat": [5, 6, 7]
}
```

**Odpowiedź gdy brak danych**:
```json
{
  "today": 0,
  "date_stat": 0,
  "sport_stat": 0,
  "family_stat": 0,
  "small_stat": 0
}
```

**Metoda HTTP**: `GET`  
**Cache**: TanStack Query `staleTime: 24*60*60*1000` (dane historyczne zmieniają się rzadko)

---

## Endpoint 3: Dane dla wybranej daty — ISTNIEJĄCY (bez zmian)

```
GET /get_date_data/?date=YYYY-MM-DD
```

**Opis**: Zwraca dane obłożenia basenów dla wskazanej daty (06:00–21:00).

**Parametr query**: `date` — format `YYYY-MM-DD`

**Uwierzytelnienie**: Session-based. Wymagane nagłówki:

| Nagłówek | Wartość | Opis |
|----------|---------|------|
| `X-Session-Key` | `{session_id}` | Wartość `session_id` z odpowiedzi `/api/current/` |

**Odpowiedź 200 OK — dane dostępne**:
```json
{
  "date": ["2026-05-04 09:00", "2026-05-04 09:15"],
  "sport": [40, 42],
  "family": [75, 78],
  "small": [14, 15],
  "ice": [110, 115]
}
```

**Odpowiedź 200 OK — brak danych**:
```json
{
  "error": "Brak danych dla wybranej daty.",
  "date": [],
  "sport": [],
  "family": [],
  "small": [],
  "ice": []
}
```

**Kody błędów**:
| Kod | Treść | Przyczyna |
|-----|-------|-----------|
| 401 | `{"error": "Brak autoryzacji"}` | Brak nagłówka `X-Session-Key` |
| 401 | `{"error": "Sesja wygasła"}` | Sesja Django nieaktywna |
| 403 | `{"error": "Nieprawidłowa sesja"}` | `session_id` niezgodny z aktywną sesją |
| 400 | `{"error": "No date provided"}` | Brak parametru `date` |
| 429 | — | Rate limit: 60 req/min na IP |

**Metoda HTTP**: `GET`, `credentials: 'include'` (session cookie)

---

## Endpoint 4: Chatbot — ISTNIEJĄCY (bez zmian)

```
POST /chatbot/api/chat/
```

**Opis**: Wysyła wiadomość użytkownika do chatbota i zwraca odpowiedź.

**Uwierzytelnienie**: Brak (publiczny). CSRF wymagany.

**Nagłówki żądania**:

| Nagłówek | Wartość |
|----------|---------|
| `Content-Type` | `application/json` |
| `X-CSRFToken` | Wartość z cookie `csrftoken` |

**Body żądania**:
```json
{ "message": "Czy basen jest teraz otwarty?" }
```

**Walidacja po stronie React**: `message.trim().length` musi być > 0 i ≤ 500 znaków.

**Odpowiedź 200 OK**:
```json
{ "response": "Tak, basen jest otwarty. Aktualne obłożenie wynosi..." }
```

**Metoda HTTP**: `POST`, `credentials: 'include'`

---

## Nginx Proxy Routing (produkcja)

| Ścieżka React | Proxy do Django |
|--------------|-----------------|
| `/api/*` | `http://web:8000/api/*` |
| `/update_chart/*` | `http://web:8000/update_chart/*` |
| `/get_date_data/*` | `http://web:8000/get_date_data/*` |
| `/chatbot/*` | `http://web:8000/chatbot/*` |
| `/*` (pozostałe) | `/usr/share/nginx/html/index.html` (SPA routing) |

---

## Uwagi bezpieczeństwa

- CORS wyłączony w produkcji (same-origin przez nginx) — brak nagłówków `Access-Control-*`
- CORS aktywny tylko gdy `DJANGO_DEBUG=True` (środowisko dev), ograniczony do `localhost:5173`
- CSRF obowiązkowy dla POST `/chatbot/api/chat/`; cookie SameSite=Lax
- `X-Session-Key` weryfikowany przez Django — nie przechowywać w localStorage (XSS risk); używać tylko z pamięci React state (session storage jako fallback)
- Rate limiting 60 req/min na IP dla `/get_date_data/` — obsługa 429 w React z komunikatem
