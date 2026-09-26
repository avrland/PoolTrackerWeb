# Implementation Plan: Przywrócenie brakujących funkcjonalności frontendu React

**Branch**: `004-restore-frontend-features` | **Date**: 2026-05-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-restore-frontend-features/spec.md`

## Summary

Przywrócenie 7 funkcjonalności utraconych podczas migracji z szablonów Django na React SPA: popupy z godzinami otwarcia pływalni, adresy Google Maps, karta pogody (OpenWeatherMap), karta Facebook, wykres obłożenia bieżącego dnia, tryb nocny z trwałością w localStorage, oraz poprawka przesunięcia +1h godzin na wykresach historycznych wynikającego z braku konwersji UTC → Europe/Warsaw.

## Technical Context

**Language/Version**: Python 3.11 (backend Django), JavaScript/ES2022 (frontend React 18, Vite 5)  
**Primary Dependencies**: Django 4.x + Gunicorn (backend), React 18 + TanStack Query + react-apexcharts (frontend), django-cors-headers (dev)  
**Storage**: PostgreSQL 16 — tabela `poolStats` (bieżące dane), `poolstats_history` (dane historyczne)  
**Testing**: pytest (backend), Vitest + Testing Library (frontend)  
**Target Platform**: Docker Compose — Nginx 1.25-alpine (frontend SPA + reverse proxy), Python 3.11 (backend)  
**Project Type**: Web application (backend/ + frontend/)  
**Performance Goals**: Dashboard load < 2s (p95), API response < 500ms (p95), wykres bieżącego dnia < 1s  
**Constraints**: Klucz OpenWeatherMap dostępny w `settings.OPENWEATHER_API_KEY`; pogoda buforowana, max 1 zapytanie/10 min  
**Scale/Scope**: Kilkuset użytkowników dziennie, 4 pływalnie, dane co ~5 min

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| **I. Code Quality** — Type hints, docstrings, PEP 8, single-responsibility | ✅ PASS | `api_weather_view()` i zmodyfikowane widoki otrzymają type hints + docstrings. Komponenty React podzielone na pojedyncze odpowiedzialności (WeatherCard, PoolModal, TodayChart itd.). |
| **II. TDD** — Testy przed implementacją, min. 80% pokrycia dla nowego kodu | ✅ PASS | Nowy endpoint `/api/weather/` wymaga testu jednostkowego (`test_api_weather_view`). Poprawka timezone w `update_chart` wymaga testu regresji. Komponenty React testowane przez Vitest. |
| **III. UX Consistency** — Mobile-first, WCAG 2.1 AA, loading states, Polish error messages | ✅ PASS | `<dialog>` zapewnia WCAG 2.1 AA focus trap. WeatherCard: loading state + komunikat po polsku „Brak danych pogodowych" przy błędzie 503. DarkModeToggle: `aria-label`. |
| **IV. Performance** — Dashboard < 2s, API < 500ms, cache | ✅ PASS | Pogoda: cache 600s — OpenWeatherMap wywoływany max 1 raz/10 min. TodayChart: reużywa TanStack cache `['current']` — 0 dodatkowych zapytań. FOUC eliminowany inline scriptem. |
| **Security** — Sekrety w env vars | ✅ PASS | `OPENWEATHER_API_KEY` pozostaje wyłącznie po stronie serwera. Brak nowych sekretów. Endpoint `/api/weather/` nie ujawnia klucza API. |

**Post-design wynik**: Wszystkie bramki zaliczone. Plan jest kompletny i gotowy do `/speckit.tasks`.

## Project Structure

### Documentation (this feature)

```text
specs/004-restore-frontend-features/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── api-endpoints.md
│   └── environment-variables.md
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
backend/  (tablechart/)
├── chart_app/
│   ├── views.py              # [MODIFY] dodaj api_weather_view, napraw timezone w update_chart
│   └── urls.py               # [MODIFY] dodaj /api/weather/
└── tablechart/
    └── settings.py           # [no change — OPENWEATHER_API_KEY już skonfigurowany]

frontend/
└── src/
    ├── index.css             # [MODIFY] dark mode CSS variables + pool modal styles
    ├── App.jsx               # [MODIFY] dark mode context provider
    ├── pages/
    │   └── Dashboard.jsx     # [MODIFY] dodaj Weather, Facebook, Today chart, dark toggle
    ├── components/
    │   ├── CurrentOccupancy.jsx   # [MODIFY] dodaj Google Maps adresy + klikalne ikony
    │   ├── HistoricalChart.jsx    # [no change — fix jest w backend]
    │   ├── PoolModal.jsx          # [NEW] okno modalne z godzinami otwarcia
    │   ├── WeatherCard.jsx        # [NEW] karta pogody
    │   ├── FacebookCard.jsx       # [NEW] karta Facebook
    │   ├── TodayChart.jsx         # [NEW] wykres obłożenia bieżącego dnia
    │   └── DarkModeToggle.jsx     # [NEW] przełącznik trybu nocnego
    └── services/
        └── api.js                 # [MODIFY] dodaj fetchWeather()
```

**Structure Decision**: Option 2 (Web application) — backend (`tablechart/`) + frontend (`frontend/src/`). Istniejąca struktura pozostaje bez zmian organizacyjnych.
