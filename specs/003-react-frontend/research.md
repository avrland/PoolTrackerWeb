# Research: Integracja React z PoolTracker (Full SPA)

**Feature**: 003-react-frontend  
**Date**: 2026-05-05  
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## Decision 1: Bundler — Vite vs. Create React App

- **Decision**: Vite 5.x
- **Rationale**: CRA (Create React App) jest deprecated od 2023. Vite oferuje natychmiastowy start (ESM-native HMR), szybszy cold build (~10x), mniejszy bundle, aktywny ekosystem. Idealny dla nowych projektów React 18+.
- **Alternatives considered**: Create React App (deprecated), Next.js (SSR — niepotrzebne dla SPA z osobnym Django API), Parcel (mniejszy ekosystem)

---

## Decision 2: Docker frontend — strategia serwowania

- **Decision**: Multi-stage Dockerfile: `node:20-alpine` (build) → `nginx:alpine` (serve)
- **Rationale**: 
  - Stage 1 (builder): instalacja zależności Node.js, budowanie Vite (`npm run build`) → `/dist`
  - Stage 2 (nginx): kopiuje tylko `/dist` do obrazu nginx; obraz produkcyjny nie zawiera Node.js (~25MB vs ~400MB)
  - Nginx obsługuje SPA routing (`try_files $uri /index.html`) i pełni rolę reverse proxy dla `/api/` → Django
  - Spełnia wymaganie constitution: Docker image < 500MB
- **Alternatives considered**: 
  - Serwowanie przez Django (collectstatic + whitenoise) — miesza odpowiedzialności, wymaga rebuildu Django obrazu przy każdej zmianie frontendu
  - `node:20-alpine` bezpośrednio przez `npm run preview` — brak optymalizacji nginx (gzip, cache headers, SPA routing)

---

## Decision 3: Nginx routing — SPA + API proxy

- **Decision**: Nginx jako jedyna zewnętrznie odsłonieta usługa (port 80); proxy `/api/` i `/chatbot/` do Django na wewnętrznym porcie 8000
- **Rationale**: 
  - Jeden punkt wejścia, brak problemów z CORS w produkcji (same origin)
  - `location /api/ { proxy_pass http://web:8000/api/; }` — clean URL routing
  - `location / { try_files $uri /index.html; }` — SPA routing
  - `web` serwis nie eksponuje portu 8000 na zewnątrz (tylko wewnętrzna sieć Docker)
- **Alternatives considered**: 
  - CORS na Django (`django-cors-headers`) — potrzebne TYLKO w dev, gdy React dev server jest na :5173
  - Osobny reverse proxy (Traefik, Caddy) — nadmierne dla tego projektu

---

## Decision 4: Django API — nowe endpointy

- **Decision**: Dodać `/api/current/` jako jedyny nowy endpoint; pozostałe istniejące endpoints wystarczają
- **Rationale**:
  - `GET /update_chart/stats<int:day>` → już zwraca `JsonResponse` — używalny bezpośrednio przez React
  - `GET /get_date_data/?date=YYYY-MM-DD` → już zwraca `JsonResponse` — używalny bezpośrednio
  - `POST /chatbot/api/chat/` → już jest API — używalny bezpośrednio
  - Brakuje: `GET /api/current/` (odpowiednik `content_view` zwracający JSON zamiast HTML)
  - URL prefix `/api/` dla nowych endpointów utrzymuje spójność i umożliwia czysty nginx proxy
- **Existing endpoints reused**:
  - `/update_chart/stats<int:day>` — pozostaje bez zmian (już JSON)
  - `/get_date_data/` — pozostaje bez zmian (już JSON); auth przez session cookie
  - `/chatbot/api/chat/` — pozostaje bez zmian (już JSON)

---

## Decision 5: CORS — dev vs. produkcja

- **Decision**: `django-cors-headers` tylko dla dev (gdy `DJANGO_DEBUG=True`), skonfigurowany przez `settings.py`; w produkcji brak CORS (same-origin przez nginx)
- **Rationale**: W dev developer uruchamia `npm run dev` (Vite na :5173) obok Django na :8000. Potrzebny CORS tylko wtedy. W produkcji wszystko za nginx — jeden origin — zero CORS.
- **Alternatives considered**: Zawsze włączony CORS — niepotrzebne ryzyko bezpieczeństwa; whitelist specific origins — bardziej skomplikowane konfigurowanie

---

## Decision 6: React state management

- **Decision**: React Context + `useState`/`useEffect` hooks — bez Redux
- **Rationale**: Aplikacja jest stosunkowo prosta (3 widoki, 2-3 typy danych). Redux to overhead dla tego rozmiaru. TanStack Query (React Query) do data fetching — obsługuje stany ładowania, cache, automatyczne odświeżanie.
- **Alternatives considered**: Redux Toolkit (overhead), Zustand (sensowne, ale TanStack Query wystarczy), SWR (alternatywa dla React Query — oba dobre, TanStack Query popularniejszy)

---

## Decision 7: Charting library w React

- **Decision**: ApexCharts + `react-apexcharts` wrapper
- **Rationale**: Istniejąca aplikacja już używa ApexCharts (pliki w `static/assets/vendor/apexcharts/`). Migracja do React przez oficjalny wrapper `react-apexcharts` minimalizuje przejście — ta sama konfiguracja wykresów, ta sama biblioteka.
- **Alternatives considered**: Recharts (lżejszy, React-native), Chart.js + `react-chartjs-2` (też obecny w projekcie), D3.js (zbyt niskopoziomowy) — wszystkie wymagają przepisania konfiguracji wykresów

---

## Decision 8: Kolejność migracji szablonów

- **Decision**: Stopniowa migracja w kolejności: (1) API layer Django → (2) React scaffold + routing → (3) CurrentOccupancy view → (4) HistoricalChart view → (5) ChatbotWidget
- **Rationale**: Każdy krok dostarcza niezależnie testowalną wartość (zgodnie ze specyfikacją: P1 → P2 → P3). Backend API gotowy przed frontendem eliminuje blokery.
- **Alternatives considered**: Big-bang migration (wszystko naraz) — wysokie ryzyko, trudne debugowanie

---

## Decision 9: Session auth dla get_date_data

- **Decision**: React wysyła `credentials: 'include'` w fetch requests; Django session cookie przesyłany automatycznie. CSRF token pobierany z cookie `csrftoken` i wysyłany w nagłówku `X-CSRFToken`.
- **Rationale**: `get_date_data` sprawdza `session_key` z nagłówka lub query param. React może wysyłać `X-Session-Key` header z wartością pobraną przy inicjalizacji sesji (przez `/api/current/` który zwraca `session_id`).
- **Alternatives considered**: JWT auth — nadmierne przeprojektowanie dla istniejącego mechanizmu sesji Django

---

## Resolved NEEDS CLARIFICATION

| Item | Resolution |
|------|------------|
| FR-010: SPA vs. hybryda | **Opcja A: pełne SPA** — React SPA obsługiwany przez Nginx, Django jako API (potwierdzono przez użytkownika) |
