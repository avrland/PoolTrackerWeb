# Data Model: Wykres dnia z datepickerem, poprawka kafelka Aquapark i naprawa CSRF chatbota

**Feature**: `006-ui-datepicker-aquapark-csrf`  
**Date**: 2026-05-06

---

## Encje i przepływ danych

### 1. DayChartData — dane wykresu dnia

Dane pobierane z backendu dla jednego doby. Schemat identyczny niezależnie od endpointu (bieżący lub historyczny).

| Pole | Typ | Opis |
|------|-----|------|
| `date` | `string[]` | Znaczniki czasu w formacie `"YYYY-MM-DD HH:MM"` (czas Warsaw), jedna wartość na pomiar |
| `sport` | `number[]` | Liczba osób na pływalni sportowej w każdym momencie |
| `family` | `number[]` | Liczba osób na pływalni rodzinnej |
| `small` | `number[]` | Liczba osób na pływalni kameralnej |
| `ice` | `number[]` | Liczba osób na lodowisku |
| `lastdate` | `string` | Znacznik ostatniego pomiaru do wyświetlenia |

**Transformacja po stronie klienta**:  
`categories = date.map(dt => dt.slice(11, 16))` → tablica `"HH:MM"` jako etykiety osi X wykresu.

**Stan komponentu TodayChart**:

| Pole stanu | Typ | Wartość domyślna | Opis |
|------------|-----|-----------------|------|
| `selectedDate` | `string` | `YYYY-MM-DD` (dzisiaj) | Wybrana data z datepickera |
| `isToday` | `boolean` | `true` | Czy wybrana data == dziś |

**React Query keys**:
- Bieżący dzień: `['current']` — cache współdzielona z `CurrentOccupancy`
- Dzień historyczny: `['date', 'YYYY-MM-DD']` — osobna cache per data, nie odświeżana automatycznie

---

### 2. AquaparkCountdown — dane licznika Aquaparku

W pełni obliczane po stronie klienta. Brak zależności od API.

| Pole | Typ | Opis |
|------|-----|------|
| `days` | `number` | Liczba pełnych dni do 15 grudnia 2028 |
| `hours` | `number` | Reszta godzin (po odjęciu pełnych dni), 0–23 |
| `minutes` | `number` | Reszta minut (po odjęciu godzin), 0–59 |
| `seconds` | `number` | Reszta sekund (po odjęciu minut), 0–59 |
| `isOpen` | `boolean` | `true` jeśli `new Date() >= TARGET` |

**Stała**:
```
TARGET_DATE = new Date('2028-12-15T00:00:00')  // czas lokalny
```

**Odświeżanie**: `setInterval(tick, 1000)` + czyszczenie przez `clearEffect` przy odmontowaniu komponentu.

---

### 3. CsrfToken — token CSRF dla chatbota

Nie jest encją zarządzaną przez React. Ciasteczko `csrftoken` jest ustawiane przez serwer Django w nagłówku `Set-Cookie` odpowiedzi GET na `/api/current/`. Odczytywane z `document.cookie` przez istniejącą funkcję `getCsrfToken()` w `api.js`.

| Aspekt | Opis |
|--------|------|
| Źródło | Django `@ensure_csrf_cookie` na `api_current_view` |
| Przechowywanie | Ciasteczko przeglądarki `csrftoken` |
| Użycie | Nagłówek `X-CSRFToken` w POST `/chatbot/api/chat/` |
| Odczyt | `getCsrfToken()` z `document.cookie` (istniejąca logika bez zmian) |

---

## Powiązania między komponentami

```
Dashboard
├── sessionId (useState, null → string po załadowaniu)
├── CurrentOccupancy
│   └── onSessionId(data.session_id) → ustawia sessionId w Dashboard
└── TodayChart(sessionId)
    ├── selectedDate == today → useQuery(['current'], fetchCurrentData)
    │                           (ta sama cache co CurrentOccupancy — 0 extra requests)
    └── selectedDate != today → useQuery(['date', selectedDate],
                                         () => fetchDateData(selectedDate, sessionId),
                                         { enabled: !!sessionId })
```

---

## Walidacje i ograniczenia

- Datepicker: `max={todayStr}` — nie można wybrać daty z przyszłości.
- Datepicker: `disabled={!sessionId}` — blokowany do czasu załadowania pierwszego żądania (uniemożliwia żądania bez ważnej sesji).
- Licznik: gdy `isOpen === true`, wyświetlany jest komunikat zamiast odliczania; `clearInterval` jest wywoływane.
- Dane historyczne: puste `date[]` (lub brak pola) → komunikat „Brak danych z wybranego dnia", wykres nie renderuje się.
