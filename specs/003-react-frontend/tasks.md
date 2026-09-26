# Tasks: Integracja React z PoolTracker (Full SPA)

**Input**: Design documents from `/specs/003-react-frontend/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Tests are NOT included (not requested in spec)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold the `frontend/` project and prepare Docker/nginx skeleton.

- [X] T001 Create `frontend/` directory structure per plan.md (`src/components/`, `src/pages/`, `src/services/`, `src/tests/`)
- [X] T002 Create `frontend/package.json` with dependencies: `react@18`, `react-dom@18`, `react-router-dom`, `@tanstack/react-query`, `react-apexcharts`, `apexcharts`; devDependencies: `vite@5`, `@vitejs/plugin-react`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`
- [X] T003 [P] Create `frontend/vite.config.js` with React plugin, test config (Vitest + jsdom), and dev proxy to `http://localhost:8000` for `/api/`, `/update_chart/`, `/get_date_data/`, `/chatbot/`
- [X] T004 [P] Create `frontend/index.html` — entry HTML z `<div id="root">` i `<script type="module" src="/src/main.jsx">`
- [X] T005 [P] Create `frontend/.env.example` z `VITE_API_BASE_URL=http://localhost:8000` (nie commitować `.env.local`)
- [X] T006 Create `frontend/Dockerfile` — multi-stage: Stage 1 `node:20-alpine AS builder` (npm ci + npm run build), Stage 2 `nginx:1.25-alpine` (kopiuje `/app/dist` do `/usr/share/nginx/html`, kopiuje `nginx.conf`)
- [X] T007 Create `frontend/nginx.conf` — SPA routing (`try_files $uri /index.html`), gzip on, proxy `/api/` → `http://web:8000/api/`, proxy `/update_chart/` → `http://web:8000/update_chart/`, proxy `/get_date_data/` → `http://web:8000/get_date_data/` (z `proxy_set_header Cookie`), proxy `/chatbot/` → `http://web:8000/chatbot/`, cache headers dla static assets

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Django API endpoint + Docker Compose update + React app shell. Must complete before any user story.

**⚠️ CRITICAL**: Żadna User Story nie może być implementowana przed ukończeniem tej fazy.

- [X] T008 Add `api_current_view` function to `tablechart/chart_app/views.py` — `@require_GET`, type hints, returns `JsonResponse` with `CurrentData` shape (see data-model.md): date, sport, family, small, ice arrays + last* values + *_percent values + session_id + opening. Reuse existing DB query logic from `content_view`. Creates Django session if not exists.
- [X] T009 Add `path('api/current/', views.api_current_view, name='api_current')` to `tablechart/chart_app/urls.py`
- [X] T010 Add `django-cors-headers` CORS config to `tablechart/tablechart/settings.py` — conditional on `DEBUG=True`: add `corsheaders` to `INSTALLED_APPS`, `CorsMiddleware` first in `MIDDLEWARE`, `CORS_ALLOWED_ORIGINS = ['http://localhost:5173']`
- [X] T011 Add `django-cors-headers` to `tablechart/requirements.txt`
- [X] T012 Update `docker-compose.yml` — add `frontend` service (`build: ./frontend`, `container_name: pooltracker-frontend`, `depends_on: web: condition: service_started`, `ports: "80:80"`, `restart: unless-stopped`); remove `ports: "8000:8000"` from `web` service (web dostępny tylko wewnętrznie)
- [X] T013 Create `frontend/src/main.jsx` — renders `<App />` wrapped in `QueryClientProvider` (TanStack Query, `staleTime: 5*60*1000`), `<BrowserRouter>` (React Router)
- [X] T014 Create `frontend/src/App.jsx` — React Router routes: `/` → `<Dashboard />`, catch-all `*` → redirect `/`
- [X] T015 [P] Create `frontend/src/services/api.js` — export async functions: `fetchCurrentData()` (GET `/api/current/`, `credentials: include`), `fetchHistoricalData(day)` (GET `/update_chart/stats${day}`), `sendChatMessage(message, sessionId)` (POST `/chatbot/api/chat/`, `X-CSRFToken` from cookie, `credentials: include`)
- [X] T016 [P] Create `frontend/src/components/LoadingSpinner.jsx` — centered spinner component, used as fallback for all async states

**Checkpoint**: `docker compose up --build` uruchamia aplikację; `GET http://localhost/api/current/` zwraca JSON; `http://localhost` ładuje React shell (pusta strona z `#root`)

---

## Phase 3: User Story 1 - Bieżące dane basenowe (Priority: P1) 🎯 MVP

**Goal**: Użytkownik widzi aktualne dane obłożenia basenów sport/rodzinny/mały/lodowy, procenty i czas ostatniego pomiaru. Automatyczne odświeżanie co 5 minut. Stany: loading, data, empty (brak danych z dnia), error.

**Independent Test**: Wejdź na `http://localhost` — powinna załadować się strona React z kartami basenów wypełnionymi aktualnymi danymi lub komunikatem "Brak danych z bieżącego dnia."

- [X] T017 [US1] Create `frontend/src/components/CurrentOccupancy.jsx` — uses `useQuery` (TanStack Query, `queryKey: ['current']`, `queryFn: fetchCurrentData`, `refetchInterval: 5*60*1000`); renders 4 pool cards (sport, rodzinny, mały, lodowy) with current occupancy value, percentage bar, and pool name; renders `<LoadingSpinner />` when `isLoading`; renders error message when `isError`; renders "Brak danych z bieżącego dnia." when `data.date.length === 0`; shows `lastdate` as last update timestamp
- [X] T018 [US1] Create `frontend/src/pages/Dashboard.jsx` — page layout composing `<CurrentOccupancy />` in main content area; includes page `<title>` "PoolTracker — Basen Białystok"
- [X] T019 [US1] Add `<Dashboard />` route import and `/` route to `frontend/src/App.jsx` (connects phase 2 shell to actual page)

**Checkpoint**: User Story 1 kompletna i niezależnie testowalna. Strona główna wyświetla dane basenów bez Django HTML templates.

---

## Phase 4: User Story 2 - Wykresy historyczne (Priority: P2)

**Goal**: Użytkownik wybiera dzień tygodnia i widzi interaktywny wykres obłożenia historycznego dla basenu sport/rodzinny/mały. Zmiana dnia < 1s, bez przeładowania strony.

**Independent Test**: Na stronie głównej zmień zakładkę dnia tygodnia — wykres ApexCharts powinien się zaktualizować natychmiast z nowymi danymi historycznymi dla wybranego dnia.

- [X] T020 [US2] Create `frontend/src/components/HistoricalChart.jsx` — local `useState` for `selectedDay` (0–6, default: `new Date().getDay()` adjusted Mon=0); uses `useQuery` (TanStack Query, `queryKey: ['historical', selectedDay]`, `queryFn: () => fetchHistoricalData(selectedDay)`, `staleTime: 24*60*60*1000`); renders day-of-week tab buttons (Pon–Nie); renders `<Chart type="line">` from `react-apexcharts` with series for sport_stat, family_stat, small_stat vs. date_stat on x-axis; renders `<LoadingSpinner />` on loading; renders error message on error
- [X] T021 [US2] Add `<HistoricalChart />` to `frontend/src/pages/Dashboard.jsx` below `<CurrentOccupancy />`

**Checkpoint**: User Stories 1 i 2 działają niezależnie. Wykres historyczny reaguje na zmianę dnia.

---

## Phase 5: User Story 3 - Widget chatbota (Priority: P3)

**Goal**: Widget chatbota dostępny na każdej stronie. Otwiera się/zamyka kliknięciem ikony. Wysyłanie wiadomości i wyświetlanie odpowiedzi bota bez przeładowania strony.

**Independent Test**: Kliknij ikonę chatbota w prawym dolnym rogu — widget powinien się otworzyć. Wpisz wiadomość i wyślij — chatbot powinien odpowiedzieć.

- [X] T022 [US3] Create `frontend/src/components/ChatbotWidget.jsx` — `useState` for `isOpen`, `messages: []`, `inputText`, `isTyping`; renders floating action button (bottom-right corner) that toggles `isOpen`; when open: renders chat panel with message list (user/assistant bubbles), text input (max 500 chars, trim validation), send button; on send: calls `sendChatMessage(message, sessionId)`, appends user message to `messages`, sets `isTyping: true`, awaits response, appends assistant message, clears `isTyping`; `sessionId` received via prop from `Dashboard` (from `currentData.session_id`)
- [X] T023 [US3] Add `<ChatbotWidget sessionId={currentData?.session_id} />` to `frontend/src/pages/Dashboard.jsx` — rendered outside main content flow (fixed position); pass `session_id` from `useQuery` current data result

**Checkpoint**: Wszystkie 3 User Stories kompletne. Widget chatbota dostępny i funkcjonalny.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Responsive styling, error boundaries, CSRF helper, final validation.

- [X] T024 [P] Add CSS/styles to `frontend/src/` — responsive pool cards (mobile-first, Bootstrap grid or CSS Grid), percentage bars, chatbot widget positioning; ensure WCAG 2.1 AA color contrast for pool occupancy indicators
- [X] T025 [P] Add CSRF cookie helper to `frontend/src/services/api.js` — `getCsrfToken()` function that reads `csrftoken` cookie value; use in `sendChatMessage` `X-CSRFToken` header
- [X] T026 [P] Add React Error Boundary component to `frontend/src/` — wraps `<CurrentOccupancy />` and `<HistoricalChart />` individually; catches render errors and shows fallback UI "Błąd ładowania danych. Odśwież stronę."
- [X] T027 Add `SESSION_COOKIE_SAMESITE = 'Lax'` and `SESSION_COOKIE_HTTPONLY = True` verification to `tablechart/tablechart/settings.py` (ensure correct session cookie behavior for React SPA)
- [X] T028 Run quickstart.md validation checklist — verify `curl http://localhost/api/current/` returns JSON, `curl http://localhost/update_chart/stats0` returns JSON, `curl http://localhost/dashboard` returns `index.html`, nginx gzip headers present

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Brak zależności — start natychmiast
- **Phase 2 (Foundational)**: Wymaga ukończenia Phase 1 — **blokuje wszystkie User Stories**
- **Phase 3 (US1)**: Wymaga ukończenia Phase 2
- **Phase 4 (US2)**: Wymaga ukończenia Phase 2; może być równoległa z Phase 3
- **Phase 5 (US3)**: Wymaga ukończenia Phase 2 + dostępności `session_id` z US1 (T017)
- **Phase 6 (Polish)**: Wymaga ukończenia wszystkich US

### User Story Dependencies

- **US1 (P1)**: Zależy od Phase 2 (T008–T016). Niezależna od US2, US3.
- **US2 (P2)**: Zależy od Phase 2 (T015 `fetchHistoricalData`). Niezależna od US1, US3.
- **US3 (P3)**: Zależy od Phase 2 (T015 `sendChatMessage`) + `session_id` z T017 (US1). Zależy od US1.

### Parallel Opportunities (Phase 1)

```
T001 (structure) → T002 (package.json)
T003 [P] (vite.config)  ─┐
T004 [P] (index.html)    ├─ równolegle po T001
T005 [P] (.env.example)  │
T006 (Dockerfile)        │ (po T001)
T007 (nginx.conf)       ─┘ (po T001)
```

### Parallel Opportunities (Phase 2)

```
T008 (api_current_view)  ─┐
T009 (urls.py)            │ sekwencyjnie (T009 po T008)
T010 (CORS settings)      ├─ niezależnie
T011 (requirements.txt) ──┘
T012 (docker-compose)    ── niezależnie
T013 (main.jsx)          ─┐
T015 [P] (api.js)         ├─ równolegle po T001
T016 [P] (LoadingSpinner) ┘
T014 (App.jsx)           ── po T013
```

---

## Implementation Strategy

**MVP = Phase 1 + Phase 2 + Phase 3 (User Story 1)**

Po T019 aplikacja jest deployowalna: React SPA z bieżącymi danymi basenów, Django jako API, nginx jako reverse proxy, pełny Docker Compose stack.

**Incremental delivery:**
1. ✅ Phase 1–2: Docker skeleton działa, `/api/current/` dostępne
2. ✅ + Phase 3: Strona główna z kartami basenów (MVP)
3. ✅ + Phase 4: Wykresy historyczne (US2)
4. ✅ + Phase 5: Chatbot widget (US3)
5. ✅ + Phase 6: Polish, bezpieczeństwo, walidacja

---

## Task Summary

| Faza | Zadania | User Story | Równolegle |
|------|---------|-----------|------------|
| Phase 1: Setup | T001–T007 | — | T003, T004, T005 |
| Phase 2: Foundational | T008–T016 | — | T015, T016 |
| Phase 3: US1 (P1) | T017–T019 | US1 | — |
| Phase 4: US2 (P2) | T020–T021 | US2 | — |
| Phase 5: US3 (P3) | T022–T023 | US3 | — |
| Phase 6: Polish | T024–T028 | — | T024, T025, T026 |
| **TOTAL** | **28 tasks** | | |

**Per User Story:** US1 = 3 tasks, US2 = 2 tasks, US3 = 2 tasks  
**Parallel opportunities:** 8 tasks marked [P]  
**Suggested MVP scope:** Phase 1 + 2 + 3 (T001–T019, 19 tasks)
