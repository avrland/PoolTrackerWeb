# Data Model: Integracja React z PoolTracker

**Feature**: 003-react-frontend  
**Date**: 2026-05-05

Dokument opisuje strukturę danych wymienianych między backendem Django a frontendem React oraz wewnętrzne typy stanu React. Baza danych pozostaje bez zmian.

---

## Istniejące encje bazy danych (bez zmian)

### `poolStats` — bieżące dane

| Kolumna | Typ SQL | Opis |
|---------|---------|------|
| `date` | `TIMESTAMPTZ` | Znacznik czasu pomiaru (UTC, wyświetlany w Europe/Warsaw) |
| `sport` | `INTEGER` | Liczba osób na basenie sportowym (max 105) |
| `family` | `INTEGER` | Liczba osób na basenie rodzinnym (max 150) |
| `small` | `INTEGER` | Liczba osób na basenie małym (max 30) |
| `ice` | `INTEGER` | Liczba osób na lodowisku (max 300) |

### `poolStats_history` — dane historyczne

| Kolumna | Typ SQL | Opis |
|---------|---------|------|
| `weekday` | `VARCHAR` | Nazwa dnia tygodnia po angielsku (Monday–Sunday) |
| `time` | `TIME` | Godzina pomiaru |
| `sport` | `INTEGER` | Średnie obłożenie basenu sportowego |
| `family` | `INTEGER` | Średnie obłożenie basenu rodzinnego |
| `small` | `INTEGER` | Średnie obłożenie basenu małego |
| `ice` | `INTEGER` | Średnie obłożenie lodowiska |

---

## API Response Shapes (kontrakty JSON)

### `GET /api/current/` — bieżące dane (NOWY endpoint)

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
  "session_id": "abc123xyz",
  "opening": null
}
```

**Uwagi:**
- `opening` — string z datą otwarcia lodowiska lub `null` jeśli otwarte
- `*_percent` — wartości 0–100 (zaokrąglone do int)
- Gdy brak danych z bieżącego dnia: wszystkie `last*` = `0`, `date` = `[]`, `opening` = wartość string

### `GET /update_chart/stats<int:day>` — historyczne (BEZ ZMIAN)

```json
{
  "today": "Poniedziałek",
  "date_stat": ["06:00", "06:15", "06:30"],
  "sport_stat": [10, 12, 15],
  "family_stat": [20, 22, 25],
  "small_stat": [5, 6, 7]
}
```

**Uwagi:** `day` — 0 = Poniedziałek, 6 = Niedziela. Lodowisko `ice` nie jest w danych historycznych.

### `GET /get_date_data/?date=YYYY-MM-DD` — dane dla daty (BEZ ZMIAN)

```json
{
  "date": ["2026-05-04 09:00", "2026-05-04 09:15"],
  "sport": [40, 42],
  "family": [75, 78],
  "small": [14, 15],
  "ice": [110, 115]
}
```

**Lub błąd:** `{ "error": "Brak danych dla wybranej daty.", "date": [], ... }`

**Auth**: Wymaga nagłówka `X-Session-Key` = aktywny `session_id` (pobrany z `/api/current/`)

### `POST /chatbot/api/chat/` — chatbot (BEZ ZMIAN)

**Request:**
```json
{ "message": "Czy basen jest teraz otwarty?" }
```

**Response:**
```json
{ "response": "Tak, basen jest otwarty. Aktualne obłożenie..." }
```

---

## Stan React (frontend internal state)

### `useDashboardData` hook

```javascript
{
  currentData: CurrentData | null,
  isLoading: boolean,
  isError: boolean,
  error: Error | null,
  refetch: () => void
}
```

### `useHistoricalData(day)` hook

```javascript
{
  historicalData: HistoricalData | null,
  isLoading: boolean,
  isError: boolean,
  selectedDay: number,      // 0–6
  setSelectedDay: (day: number) => void
}
```

### `useChatbot` hook

```javascript
{
  messages: ChatMessage[],
  isTyping: boolean,
  sendMessage: (text: string) => void
}

// ChatMessage
{
  id: string,
  role: 'user' | 'assistant',
  text: string,
  timestamp: Date
}
```

---

## Stany UI (stan wizualny komponentów)

### CurrentOccupancy komponent

| Stan | Opis |
|------|------|
| `loading` | Pierwsze ładowanie — wyświetla `LoadingSpinner` |
| `empty` | Brak danych z dnia — komunikat "Brak danych z bieżącego dnia" |
| `data` | Dane dostępne — wyświetla karty basenów z wartościami i procentami |
| `error` | Błąd API — komunikat błędu z przyciskiem "Spróbuj ponownie" |

### HistoricalChart komponent

| Stan | Opis |
|------|------|
| `loading` | Ładowanie danych dla wybranego dnia |
| `data` | Dane dostępne — wykres ApexCharts |
| `empty` | Brak danych historycznych dla dnia |
| `error` | Błąd API |

### ChatbotWidget komponent

| Stan | Opis |
|------|------|
| `closed` | Ikona widgetu w rogu ekranu |
| `open` | Panel czatu widoczny |
| `typing` | Bot pisze odpowiedź — animacja |

---

## Walidacja danych (granica systemu)

Walidacja odbywa się wyłącznie w Django (istniejąca logika). React traktuje dane z API jako zaufane i renderuje je bezpośrednio. Jedyna walidacja na froncie:

- Sprawdzenie istnienia `session_id` przed wysłaniem `get_date_data`
- Trim i length check dla wiadomości chatbota (max 500 znaków) przed wysłaniem
