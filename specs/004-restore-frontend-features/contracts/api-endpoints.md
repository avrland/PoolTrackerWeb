# API Endpoints Contract: Przywrócenie brakujących funkcjonalności frontendu React

**Feature**: `004-restore-frontend-features`  
**Date**: 2026-05-05

---

## Nowe endpointy

### GET `/api/weather/`

**Opis**: Zwraca aktualne dane pogodowe dla Białegostoku z cache.  
**Auth**: Brak (publiczny endpoint)  
**Rate limit**: Brak (odpowiedź serwowana z cache — max 1 zapytanie do OpenWeatherMap co 10 min)

#### Request
```
GET /api/weather/ HTTP/1.1
```
Brak parametrów, nagłówków ani body.

#### Response — sukces (HTTP 200)
```json
{
  "icon": "02d",
  "description": "Pochmurnie",
  "temp": 22,
  "feels_like": 20,
  "humidity": 65
}
```

| Pole | Typ | Opis |
|------|-----|------|
| `icon` | `string` | Kod ikony OpenWeatherMap (np. `"02d"`, `"04n"`) — użyj jako: `https://openweathermap.org/img/wn/{icon}@2x.png` |
| `description` | `string` | Opis pogody po polsku z wielką literą (np. `"Zachmurzenie duże"`) |
| `temp` | `number` | Temperatura w °C (zaokrąglona do całości) |
| `feels_like` | `number` | Temperatura odczuwalna w °C (zaokrąglona do całości) |
| `humidity` | `number` | Wilgotność w % (0–100) |

#### Response — błąd serwisu pogodowego (HTTP 503)
```json
{
  "error": "Usługa pogodowa niedostępna"
}
```

#### Nagłówki odpowiedzi
```
Cache-Control: public, max-age=600
Content-Type: application/json
```

#### Zachowanie cache
- Pierwsze żądanie → zapytanie do OpenWeatherMap API → zapis w Django cache (TTL 600s) → odpowiedź
- Kolejne żądania w ciągu 10 min → dane z Django cache → odpowiedź (brak zapytania do OpenWeatherMap)
- Po upływie 600s → cykl powtarza się

---

## Istniejące endpointy — bez zmian w kontrakcie, zmiany wewnętrzne

### GET `/api/current/`

**Bez zmian w kontrakcie** — wewnętrznie bez modyfikacji.  
Dane `date`, `sport`, `family`, `small`, `ice` reużywane przez nowy komponent `TodayChart` przez TanStack Query cache.

### GET `/update_chart/stats{day}`

**Bez zmian w kontrakcie** — zmiana wewnętrzna: poprawka timezone.  
Pole `date_stat` (tablica godzin `HH:MM`) będzie zwracać czas warszawski zamiast czas z offsetem +1h.

**Przed poprawką** (błąd):
```json
{ "date_stat": ["07:00", "07:30", "08:00", ...] }
```

**Po poprawce** (poprawna strefa Warsaw):
```json
{ "date_stat": ["06:00", "06:30", "07:00", ...] }
```

> **Uwaga dla frontend**: Zmiana ta jest poprawkąbłędu (bug fix) — dane przed poprawką były nieprawidłowe. Frontend nie wymaga żadnych zmian do obsługi poprawionej odpowiedzi.

---

## Istniejące endpointy — bez zmian

| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/api/current/` | GET | Bieżące obłożenie + dane dnia |
| `/update_chart/stats{day}` | GET | Historyczne statystyki dla dnia tygodnia (0=Pon) |
| `/get_date_data/` | GET | Dane obłożenia dla wybranej daty |
| `/chatbot/api/chat/` | POST | Chatbot |
