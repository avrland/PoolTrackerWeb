# Tasks: Przywrócenie brakujących funkcjonalności frontendu React

**Input**: Design documents from `/specs/004-restore-frontend-features/`  
**Branch**: `004-restore-frontend-features`  
**Generated**: 2026-05-05

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US7 matching user stories from spec.md
- All paths relative to repository root

---

## Phase 1: Setup

**Purpose**: Rozszerzenie konfiguracji POOLS — jedyne współdzielone dane statyczne blokujące US1 i US2

- [X] T001 Rozszerz stałą `POOLS` w `frontend/src/components/CurrentOccupancy.jsx` o pola `address`, `mapsUrl` i `hours` dla wszystkich 4 obiektów zgodnie z `data-model.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infrastruktura wymagana przez wiele user stories — musi być gotowa przed US1, US5 i US6

**⚠️ CRITICAL**: US1 (PoolModal), US5 (TodayChart), US6 (DarkMode) nie mogą startować przed tym etapem

- [X] T002 Dodaj inline script anty-FOUC do `frontend/index.html` w `<head>` przed `<script type="module">`: odczytuje `localStorage['theme']` i ustawia `data-theme` na `<html>` przed renderem React
- [X] T003 Dodaj CSS custom properties (zmienne kolorów dla trybu jasnego i ciemnego) do początku `frontend/src/index.css`: definiuje `:root { --color-bg, --color-card-bg, ... }` i `html[data-theme='dark'] { ... }`
- [X] T004 Utwórz `frontend/src/contexts/ThemeContext.jsx` z `ThemeProvider` i hookiem `useTheme()`: stan oparty na localStorage + atrybut `data-theme` na `<html>` + obsługa `prefers-color-scheme`

**Checkpoint**: Dane POOLS rozszerzone, CSS vars zdefiniowane, ThemeContext gotowy → US1, US2, US5, US6 mogą startować równolegle

---

## Phase 3: User Story 1 — Popup z godzinami otwarcia pływalni (Priority: P1) 🎯 MVP

**Goal**: Kliknięcie ikony pływalni otwiera okno modalne z harmonogramem godzin otwarcia

**Independent Test**: Kliknij ikonę każdej z 4 pływalni → okno z tabelą godzin dla danego obiektu, Escape/Zamknij go chowa

- [X] T005 [US1] Utwórz `frontend/src/components/PoolModal.jsx`: komponent oparty na natywnym elemencie `<dialog>`, przyjmuje props `isOpen`, `onClose`, `title`, `hours` (słownik dzień→godziny); obsługuje Escape (onClose), kliknięcie backdrop, style w `index.css`
- [X] T006 [P] [US1] Dodaj style CSS dla `.pool-modal` i `::backdrop` do `frontend/src/index.css`: responsywne okno modalne działające w trybie jasnym i ciemnym (używa CSS vars z T003)
- [X] T007 [US1] Zmodyfikuj `frontend/src/components/CurrentOccupancy.jsx`: dodaj stan `openModal` (null | poolKey), przekształć element ikony pływalni w przycisk `onClick`, renderuj `<PoolModal>` dla aktywnego klucza pływalni (korzysta z rozszerzonej konfiguracji POOLS z T001 i komponentu z T005)

---

## Phase 4: User Story 2 — Adresy Google Maps pod kartami pływalni (Priority: P1) 🎯 MVP

**Goal**: Każda karta pływalni wyświetla adres jako klikalny link do Google Maps

**Independent Test**: Kliknij adres pod każdą kartą → otwiera Google Maps z właściwą lokalizacją w nowej karcie

- [X] T008 [P] [US2] Zmodyfikuj template karty pływalni w `frontend/src/components/CurrentOccupancy.jsx`: dodaj element `<a href={pool.mapsUrl} target="_blank" rel="noopener noreferrer">{pool.address}</a>` pod każdą kartą, używając pól `address` i `mapsUrl` z rozszerzonej konfiguracji POOLS (T001)

> **Uwaga**: T008 może być wykonane równocześnie z T007 — modyfikują różne fragmenty tego samego pliku, ale logicznie są niezależne. Przy jednoczesnej edycji należy skoordynować zmiany w jednym commicie.

---

## Phase 5: User Story 5 — Wykres obłożenia bieżącego dnia (Priority: P1) 🎯 MVP

**Goal**: Wykres liniowy z danymi bieżącego dnia widoczny poniżej kart obłożenia

**Independent Test**: Odwiedź stronę w trakcie dnia → wykres liniowy Sport/Rodzinny/Mały od 6:00 do teraz; gdy brak danych → komunikat zastępczy

- [X] T009 [US5] Utwórz `frontend/src/components/TodayChart.jsx`: komponent reużywający TanStack Query cache `['current']` (queryKey identyczny z `CurrentOccupancy`), renderuje `<Chart type="line">` z react-apexcharts używając pól `date`, `sport`, `family`, `small` z `/api/current/`; w przypadku braku danych (`data.date.length === 0`) wyświetla komunikat „Brak danych z bieżącego dnia" z informacją o liczbie dni do otwarcia (`data.opening`)
- [X] T010 [P] [US5] Zmodyfikuj `frontend/src/pages/Dashboard.jsx`: zaimportuj `TodayChart` i dodaj sekcję „Wykres dnia" poniżej `<CurrentOccupancy>` a powyżej `<HistoricalChart>`

---

## Phase 6: User Story 7 — Poprawka strefy czasowej na statystykach historycznych (Priority: P1)

**Goal**: Godziny na wykresach historycznych odpowiadają czasowi warszawskiemu, bez przesunięcia +1h

**Independent Test**: Wyświetl dowolny dzień historyczny → godziny na osi X zgadzają się z faktycznym czasem (np. szczyt ~17:00, nie 18:00)

- [X] T011 [US7] Zmodyfikuj `tablechart/chart_app/views.py` — funkcja `update_chart()`: zmień formatowanie listy `time_sunday_formatted` — zamiast `dt.strftime("%H:%M")` użyj `(datetime.combine(date.today(), t) - timedelta(hours=1)).strftime("%H:%M")` dla każdego elementu; dodaj import `from datetime import timedelta, date`
- [X] T012 [P] [US7] Zmodyfikuj `tablechart/chart_app/views.py` — funkcja `stats_view()`: zastosuj identyczną poprawkę `timedelta(hours=1)` dla `time_sunday_formatted` — spójność między widokiem strony głównej Django a endpointem React

---

## Phase 7: User Story 3 — Karta pogody OpenWeatherMap (Priority: P2)

**Goal**: Karta pogody na dashboardzie z temperaturą, opisem i ikoną z OpenWeatherMap

**Independent Test**: Załaduj stronę → karta pogody z temperaturą °C i opisem po polsku; gdy API niedostępne → komunikat „Brak danych pogodowych" bez błędu JS

- [X] T013 [US3] Zmodyfikuj `tablechart/chart_app/views.py` — funkcja `get_weather_data()`: dodaj Django cache (`cache.get('weather_data')` / `cache.set('weather_data', weather, 600)`) przed wywołaniem requests.get; dodaj `timeout=5` do requests.get
- [X] T014 [P] [US3] Dodaj widok `api_weather_view(request)` do `tablechart/chart_app/views.py`: dekorator `@require_GET`, wywołuje `get_weather_data()`, zwraca `JsonResponse` z nagłówkiem `Cache-Control: public, max-age=600`; zwraca HTTP 503 gdy `get_weather_data()` zwróci None
- [X] T015 [P] [US3] Zmodyfikuj `tablechart/chart_app/urls.py`: dodaj `path('api/weather/', views.api_weather_view, name='api_weather')`
- [X] T016 [P] [US3] Dodaj funkcję `fetchWeather()` do `frontend/src/services/api.js`: `GET ${BASE_URL}/api/weather/` z `credentials: 'include'`
- [X] T017 [US3] Utwórz `frontend/src/components/WeatherCard.jsx`: używa `useQuery({ queryKey: ['weather'], queryFn: fetchWeather, staleTime: 10 * 60 * 1000 })`; wyświetla ikonę (`openweathermap.org/img/wn/{icon}@2x.png`), temperaturę, opis, temperaturę odczuwalną, wilgotność; obsługuje stan ładowania i błąd (komunikat „Brak danych pogodowych"); stosuje CSS vars dark mode
- [X] T018 [P] [US3] Zmodyfikuj `frontend/src/pages/Dashboard.jsx`: dodaj `<WeatherCard>` do siatki kart pływalni

---

## Phase 8: User Story 6 — Tryb nocny (Priority: P2)

**Goal**: Przełącznik ciemnego motywu w nagłówku, preferencja zapamiętywana w localStorage

**Independent Test**: Kliknij przełącznik → interfejs ciemnieje natychmiast; przeładuj → tryb zachowany; prefers-color-scheme: dark → automatyczny ciemny przy pierwszej wizycie

- [X] T019 [US6] Owiń aplikację w `ThemeProvider` w `frontend/src/main.jsx`: zaimportuj `ThemeProvider` z `./contexts/ThemeContext` i owin `<App />` (lub `<QueryClientProvider>`) w `<ThemeProvider>`
- [X] T020 [P] [US6] Zaktualizuj `frontend/src/index.css`: zmień istniejące reguły kolorów `body`, `.pool-card`, `.pool-card__name`, `.pool-card__value`, `.progress-bar-container`, `.dashboard__header`, `.section-heading`, `.day-tab`, `.chart-wrapper`, `.chatbot-panel`, `.chatbot-panel__header`, `.chatbot-panel__messages`, `.chat-message--assistant` na używanie CSS vars (`var(--color-bg)`, `var(--color-card-bg)` itd.) zdefiniowanych w T003
- [X] T021 [US6] Utwórz `frontend/src/components/DarkModeToggle.jsx`: przycisk korzystający z `useTheme()`, wyświetla emoji lub ikonę ☀️/🌙, aria-label „Przełącz tryb ciemny/jasny"
- [X] T022 [P] [US6] Zmodyfikuj `frontend/src/pages/Dashboard.jsx`: dodaj `<DarkModeToggle>` do elementu `.dashboard__header`

---

## Phase 9: User Story 4 — Karta Facebook (Priority: P3)

**Goal**: Statyczna karta z linkiem do profilu Facebook pływalni

**Independent Test**: Kliknij kartę lub ikonę FB → otwiera `facebook.com/basenbialystok` w nowej karcie

- [X] T023 [US4] Utwórz `frontend/src/components/FacebookCard.jsx`: statyczny komponent z linkiem `href="https://www.facebook.com/basenbialystok/"`, `target="_blank"`, `rel="noopener noreferrer"`; stylizacja zgodna z CSS vars (dark mode)
- [X] T024 [P] [US4] Zmodyfikuj `frontend/src/pages/Dashboard.jsx`: dodaj `<FacebookCard>` do siatki kart pływalni obok `<WeatherCard>`

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Responsywność dark mode, weryfikacja a11y, spójność stylów

- [X] T025 [P] Dodaj media query `@media (max-width: 480px)` dla `.pool-modal` do `frontend/src/index.css`: pełna szerokość na mobile, max-height z przewijaniem
- [X] T026 [P] Sprawdź i popraw kontrast kolorów dark mode w `frontend/src/index.css`: wartości `--color-text` i `--color-muted` na ciemnym tle muszą spełniać WCAG 2.1 AA (min. 4.5:1)
- [X] T027 [P] Dodaj `ErrorBoundary` wokół `<WeatherCard>` i `<TodayChart>` w `frontend/src/pages/Dashboard.jsx` (komponent `ErrorBoundary` już istnieje w projekcie)

---

## Dependency Graph

```
T001 (POOLS config)
├── T007 (US1 — modal trigger w CurrentOccupancy)
│   └── T005 (PoolModal component)
│       └── T006 (modal CSS)
├── T008 (US2 — Google Maps links)

T002 + T003 + T004 (Foundational — dark mode infra)
├── T019 (US6 — ThemeProvider in main.jsx)
│   ├── T020 (US6 — CSS vars applied)
│   ├── T021 (US6 — DarkModeToggle)
│   └── T022 (US6 — toggle in Dashboard header)

T009 (US5 — TodayChart)
└── T010 (US5 — TodayChart in Dashboard)

T011 + T012 (US7 — timezone fix — backend only, niezależne)

T013 → T014 → T015 (US3 — backend weather endpoint)
T016 (US3 — fetchWeather in api.js)
T017 (US3 — WeatherCard) ← wymaga T016
T018 (US3 — WeatherCard in Dashboard) ← wymaga T017

T023 (US4 — FacebookCard)
T024 (US4 — FacebookCard in Dashboard) ← wymaga T023

T025, T026, T027 (Polish — niezależne, po T006/T020/T009/T017)
```

---

## Parallel Execution Examples

### Iteracja 1 (równolegle po T001)
- T002, T003, T004 — Foundational dark mode infra
- T011, T012 — Backend timezone fix (całkowicie niezależne od frontend)

### Iteracja 2 (po T002+T003+T004)
- T005+T006 — PoolModal component + CSS
- T008 — Google Maps links (jeśli T001 gotowe)
- T009 — TodayChart component
- T013 — Weather cache fix
- T019 — ThemeProvider w main.jsx

### Iteracja 3 (po poprzedniej)
- T007 — Modal trigger (po T005)
- T010 — TodayChart w Dashboard (po T009)
- T014+T015+T016 — Weather endpoint + URL + api.js (po T013)
- T020 — CSS vars applied (po T003+T019)
- T021+T022 — DarkModeToggle (po T004+T019)

### Iteracja 4 (finalizacja)
- T017 — WeatherCard (po T016)
- T023 — FacebookCard
- T025+T026+T027 — Polish

---

## Implementation Strategy

**MVP (US1 + US2 + US5 + US7)**: T001 → T003 → T005 → T006 → T007 → T008 → T009 → T010 → T011 → T012
Dostarcza: popupy z godzinami, adresy Map, wykres dnia, poprawioną strefę czasową

**Increment 2 (US3 + US6)**: T002 → T004 → T013–T018 → T019–T022
Dostarcza: tryb nocny + karta pogody

**Increment 3 (US4 + Polish)**: T023 → T024 → T025–T027
Dostarcza: karta Facebook + poprawki responsywności

---

## Summary

| Metric | Value |
|--------|-------|
| Łączna liczba zadań | 27 |
| Zadania backend (Django) | 5 (T011–T015) |
| Zadania frontend (React) | 19 (T001–T010, T016–T024) |
| Zadania CSS/polish | 3 (T025–T027) |
| User Story 1 (P1) | 3 zadania (T005–T007) |
| User Story 2 (P1) | 1 zadanie (T008) |
| User Story 3 (P2) | 6 zadań (T013–T018) |
| User Story 4 (P3) | 2 zadania (T023–T024) |
| User Story 5 (P1) | 2 zadania (T009–T010) |
| User Story 6 (P2) | 4 zadania (T019–T022) |
| User Story 7 (P1) | 2 zadania (T011–T012) |
| Foundational | 4 zadania (T001–T004) |
| Polish | 3 zadania (T025–T027) |
| Zadania parallelizowalne [P] | 16 |
| Sugerowane MVP | US1 + US2 + US5 + US7 (8 zadań core) |
