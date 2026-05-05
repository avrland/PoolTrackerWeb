# Environment Variables Contract: Przywrócenie brakujących funkcjonalności frontendu React

**Feature**: `004-restore-frontend-features`  
**Date**: 2026-05-05

---

## Zmienne środowiskowe — bez nowych wymagań

Ten feature **nie wprowadza nowych zmiennych środowiskowych**. Wszystkie wymagane zmienne już istnieją w projekcie.

---

## Istniejące zmienne wymagane przez ten feature

### Backend (tablechart/)

| Zmienna | Wymagana przez | Opis | Przykład |
|---------|----------------|------|---------|
| `OPENWEATHER_API_KEY` | `/api/weather/` (istniejący `get_weather_data()`) | Klucz API OpenWeatherMap — już skonfigurowany w `settings.py` | `abc123xyz` |
| `SECRET_KEY` | Django | Klucz Django — bez zmian | `django-insecure-...` |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | PostgreSQL connection — bez zmian | Dane bazy | jak dotychczas |

### Frontend (frontend/)

| Zmienna | Wymagana przez | Opis | Przykład |
|---------|----------------|------|---------|
| `VITE_API_BASE_URL` | `api.js` — istniejący | Bazowy URL backendu Django | `""` (pusta = ten sam host) |

---

## Weryfikacja konfiguracji

Przed wdrożeniem sprawdź, czy:
- `OPENWEATHER_API_KEY` jest ustawiony i ważny (test: `curl "https://api.openweathermap.org/data/2.5/weather?q=Białystok,pl&appid=$OPENWEATHER_API_KEY&units=metric&lang=pl"`)
- Klucz ma przypisaną subskrypcję „Current weather data" (plan Free wystarczy)
