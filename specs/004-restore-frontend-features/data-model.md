# Data Model: Przywrócenie brakujących funkcjonalności frontendu React

**Feature**: `004-restore-frontend-features`  
**Date**: 2026-05-05

---

## Przegląd przepływu danych

Wszystkie dane w tym feature'ze są albo **statyczne** (godziny otwarcia, adresy, link FB) albo **pobierane z istniejących źródeł** (baza PostgreSQL, OpenWeatherMap API). Nie ma nowych modeli bazy danych — jedyne zmiany to nowy endpoint Django i refaktor istniejących widoków.

---

## 1. Dane statyczne (hardcoded w frontend)

### Konfiguracja pływalni (rozszerzenie istniejącej `POOLS` w `CurrentOccupancy.jsx`)

```javascript
const POOLS = [
  {
    key: 'sport',
    label: 'Basen Sportowy',
    lastKey: 'lastsport',
    pctKey: 'sport_percent',
    capacity: 105,
    address: 'Włókiennicza 4, 15-465 Białystok',
    mapsUrl: 'https://maps.app.goo.gl/KXXXf2iYu16VJgCz5',
    hours: {
      Poniedziałek: '06:15–21:30',
      Wtorek:       '06:15–21:30',
      Środa:        '06:15–21:30',
      Czwartek:     '07:00–21:30',
      Piątek:       '06:15–21:30',
      Sobota:       '06:15–21:30',
      Niedziela:    '06:15–21:30',
    },
  },
  {
    key: 'family',
    label: 'Basen Rodzinny',
    lastKey: 'lastfamily',
    pctKey: 'family_percent',
    capacity: 150,
    address: 'Stroma 1A, 15-661 Białystok',
    mapsUrl: 'https://maps.app.goo.gl/gpSoMPBoRtcT9dw89',
    hours: {
      Poniedziałek: '06:15–21:30',
      Wtorek:       '06:15–21:30',
      Środa:        '06:15–21:30',
      Czwartek:     '07:00–21:30',
      Piątek:       '06:15–21:30',
      Sobota:       '06:15–21:30',
      Niedziela:    '06:15–21:30',
    },
  },
  {
    key: 'small',
    label: 'Basen Kameralny',
    lastKey: 'lastsmall',
    pctKey: 'small_percent',
    capacity: 30,
    address: 'Mazowiecka 39C, 15-302 Białystok',
    mapsUrl: 'https://maps.app.goo.gl/YTTwYV16m3tyxoW76',
    hours: {
      Poniedziałek: '06:15–21:45',
      Wtorek:       '06:15–21:45',
      Środa:        '07:00–21:45',
      Czwartek:     '06:15–21:45',
      Piątek:       '06:15–21:45',
      Sobota:       '06:15–21:45',
      Niedziela:    '06:15–21:45',
    },
  },
  {
    key: 'ice',
    label: 'Lodowisko',
    lastKey: 'lastice',
    pctKey: 'ice_percent',
    capacity: 300,
    address: '11 Listopada 28, 15-320 Białystok',
    mapsUrl: 'https://maps.app.goo.gl/WTfr4wwKsGnKtJUQ9',
    hours: {
      Poniedziałek: '17:00–18:30, 19:00–21:00',
      Wtorek:       '17:00–18:30, 19:00–20:30',
      Środa:        '17:00–18:30, 19:00–20:30',
      Czwartek:     '17:00–18:30, 19:00–21:00',
      Piątek:       '17:00–18:30, 19:00–20:30',
      Sobota:       '11:30–21:00',
      Niedziela:    '11:30–21:00',
    },
  },
]
```

---

## 2. Dane pogodowe

### Źródło: OpenWeatherMap API → Django cache → `/api/weather/` → React

**Przepływ**:
```
OpenWeatherMap API (zewnętrzny)
  → get_weather_data() [Django, cache 10 min]
  → /api/weather/ [GET, Cache-Control: public max-age=600]
  → fetchWeather() [api.js]
  → useQuery(['weather']) [TanStack, staleTime: 10 min]
  → WeatherCard [React component]
```

**Schemat odpowiedzi (sukces, HTTP 200)**:
```typescript
{
  icon: string          // Kod ikony OpenWeatherMap, np. "02d"
  description: string   // Opis po polsku, np. "Pochmurnie"
  temp: number          // Temperatura w °C (rounded integer)
  feels_like: number    // Temperatura odczuwalna w °C (rounded integer)
  humidity: number      // Wilgotność w % (0–100)
}
```

**Schemat odpowiedzi (błąd, HTTP 503)**:
```typescript
{
  error: string   // "Usługa pogodowa niedostępna"
}
```

---

## 3. Dane bieżącego dnia (wykres TodayChart)

### Źródło: istniejący `/api/current/` — bez zmian

**Przepływ**:
```
PostgreSQL poolStats (istniejąca tabela)
  → api_current_view() [Django, już istnieje]
  → /api/current/ [GET, istniejący endpoint]
  → fetchCurrentData() [api.js, już istnieje]
  → useQuery(['current']) [TanStack cache — DZIELONY między CurrentOccupancy i TodayChart]
  → TodayChart [nowy komponent, reużywa cache bez duplikatu żądania]
```

**Pola z `/api/current/` używane przez TodayChart**:
```typescript
{
  date:   string[]   // Tablice timestampów, np. ["2026-05-05 06:05", ...]
  sport:  number[]   // Liczba osób — Basen Sportowy
  family: number[]   // Liczba osób — Basen Rodzinny
  small:  number[]   // Liczba osób — Basen Kameralny
  // (ice nie jest rysowany na TodayChart — lodowisko ma inny sezon)
}
```

**Uwaga**: Godziny w `date` są już poprawnie skonwertowane do strefy Warsaw w `api_current_view()` — brak potrzeby dodatkowej korekcji dla wykresu dnia.

---

## 4. Dane historyczne (poprawka timezone)

### Źródło: istniejąca tabela `poolstats_history` — typ kolumny TIME (naive)

**Błąd (aktualny stan)**:
```
poolstats_history.time (PostgreSQL TIME)
  → psycopg2 → datetime.time (naive, wartość = czas UTC + 1h z powodu błędu scrappera)
  → dt.strftime("%H:%M") → wyświetlany czas przesunięty o +1h
```

**Poprawka (nowy stan)**:
```
poolstats_history.time (PostgreSQL TIME)
  → psycopg2 → datetime.time (naive, wartość = czas UTC + 1h z powodu błędu scrappera)
  → (datetime.combine(today, t) - timedelta(hours=1)).strftime("%H:%M")
  → wyświetlany czas poprawny (czas warszawski)
```

**Dotyczy widoków**: `update_chart()` i `stats_view()` w `chart_app/views.py`.

---

## 5. Preferencja trybu nocnego (Dark Mode)

### Źródło: localStorage (przeglądarka klienta)

**Klucz**: `'theme'`  
**Wartości**: `'dark'` | `'light'` | `null` (brak — fallback do `prefers-color-scheme`)

**Przepływ**:
```
localStorage['theme'] | window.matchMedia('prefers-color-scheme: dark')
  → inline <script> w index.html (synchroniczny, przed renderem React)
  → document.documentElement.setAttribute('data-theme', 'dark'|'light')
  → ThemeContext (React) — synchronizacja stanu React z atrybutem DOM
  → DarkModeToggle — toggle UI w nagłówku
  → useEffect → aktualizacja localStorage i atrybutu data-theme przy zmianie
```

**Brak sieciowych zależności** — wyłącznie localStorage + DOM.

---

## 6. Komponenty React — mapa zależności

```
App.jsx
└── ThemeProvider (ThemeContext.jsx) [NOWY]
    └── main.jsx wraps QueryClientProvider
        └── Dashboard.jsx [MODYFIKACJA]
            ├── DarkModeToggle.jsx [NOWY] — w nagłówku
            ├── CurrentOccupancy.jsx [MODYFIKACJA]
            │   ├── PoolModal.jsx [NOWY] × 4 instancje (jedna per pływalnia)
            │   └── Adresy Google Maps [DODANE inline]
            ├── TodayChart.jsx [NOWY] — reużywa useQuery(['current'])
            ├── WeatherCard.jsx [NOWY] — useQuery(['weather'])
            ├── FacebookCard.jsx [NOWY] — statyczny
            └── HistoricalChart.jsx [bez zmian — fix w backend]
```

---

## 7. Zmiany w modelu danych backendu

### Nowe tabele / kolumny
**Brak** — feature nie wymaga zmian schematu bazy danych.

### Nowe endpointy Django
| Endpoint | Metoda | Auth | Opis |
|----------|--------|------|------|
| `/api/weather/` | GET | Brak | Zwraca dane pogodowe (cache 10 min) |

### Zmodyfikowane widoki Django
| Widok | Zmiana |
|-------|--------|
| `get_weather_data()` | Dodać caching Django (cache.get/set, TTL 600s) |
| `update_chart()` | Odjąć timedelta(hours=1) od formatowanych czasów historycznych |
| `stats_view()` | Odjąć timedelta(hours=1) od formatowanych czasów historycznych |
