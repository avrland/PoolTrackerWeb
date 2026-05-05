# Implementation Plan: Integracja React z PoolTracker (Full SPA)

**Branch**: `003-react-frontend` | **Date**: 2026-05-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-react-frontend/spec.md`

## Summary

Zastapienie szablonow Django przez React Single Page Application. Nginx obsluguje statyczny build React i pelni role reverse proxy dla zadan API do Django. Dodawany jest jeden nowy endpoint Django (`/api/current/`); pozostale endpointy (`/update_chart/`, `/get_date_data/`, `/chatbot/api/chat/`) sa reuzywane bez zmian. Nowy serwis `frontend` w Docker Compose uzywa wieloetapowego Dockerfile (Node.js build to Nginx serve).

## Technical Context

**Language/Version**: Python 3.11 (Django backend), Node.js 20 LTS (React frontend build), Nginx 1.25-alpine (serving)
**Primary Dependencies**: React 18, Vite 5, TanStack Query (React Query), react-apexcharts, django-cors-headers (dev only)
**Storage**: PostgreSQL 16 (bez zmian)
**Testing**: Vitest + React Testing Library (frontend unit), pytest (backend - bez zmian)
**Target Platform**: Docker Compose, Linux - przegladarka (desktop + mobile)
**Project Type**: Web application - oddzielny backend (Django API) i frontend (React SPA)
**Performance Goals**: Strona glowna < 3s (p95 3G), API response < 500ms (p95), zmiana dnia wykresu < 1s
**Constraints**: Docker image frontend < 500MB (nginx:alpine ~25MB + dist), Django bez zmian strukturalnych
**Scale/Scope**: Jedna aplikacja publiczna, dane basenowe w czasie rzeczywistym, 3 glowne widoki

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| I. Code Quality — type hints, docstrings, PEP 8 | PASS | Backend: dodany widok z type hints. Frontend: TypeScript opcjonalny, JSDoc dla publicznych komponentow. |
| II. TDD — testy przed implementacja, 80% coverage | PASS | Vitest testy dla kazdego komponentu React; backend: pytest dla nowego endpointu `/api/current/` |
| III. UX Consistency — mobile-first, loading states, WCAG 2.1 AA | PASS | Loading state obowiazkowy (FR-005), error state (FR-006), responsywnosc zachowana (Bootstrap lub Tailwind) |
| IV. Performance — <2s dashboard, <500ms API, <100ms queries | PASS | nginx gzip wlaczony, build Vite optymalizuje bundle, istniejace zapytania DB bez zmian |
| Security — env vars dla sekretow, input validation | PASS | Brak nowych sekretow; CORS wylaczony w produkcji (same-origin nginx); CSRF przez cookie |
| Deployment — zero-downtime, health checks | PASS | frontend service nie ma danych stanowych; `depends_on: web` z health check |
| Docker image < 500MB | PASS | nginx:alpine + dist << 500MB |

**Violations**: Brak — wszystkie gates spelnione.

## Project Structure

### Documentation (this feature)

```text
specs/003-react-frontend/
├── plan.md              # Ten plik
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── api-endpoints.md
│   └── environment-variables.md
└── tasks.md             # Phase 2 output (speckit.tasks)
```

### Source Code (repository root)

```text
frontend/                          # NOWY serwis React SPA
├── Dockerfile                     # Multi-stage: node:20-alpine build + nginx:alpine serve
├── nginx.conf                     # SPA routing + reverse proxy /api/ -> web:8000
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── main.jsx                   # Punkt wejscia React, TanStack Query Provider
    ├── App.jsx                    # Router glowny (React Router)
    ├── components/
    │   ├── CurrentOccupancy.jsx   # Widok biezacych danych basenowych (P1)
    │   ├── HistoricalChart.jsx    # Wykres historyczny z wyborem dnia (P2)
    │   ├── ChatbotWidget.jsx      # Widget chatbota (P3)
    │   └── LoadingSpinner.jsx     # Wspolny komponent stanu ladowania
    ├── pages/
    │   └── Dashboard.jsx          # Strona glowna lacząca komponenty
    ├── services/
    │   └── api.js                 # Funkcje fetch do endpointow Django
    └── tests/
        ├── CurrentOccupancy.test.jsx
        ├── HistoricalChart.test.jsx
        └── api.test.js

tablechart/                        # MODYFIKOWANY backend Django
├── chart_app/
│   ├── views.py                   # Dodany: api_current_view (JSON endpoint)
│   └── urls.py                    # Dodany: path('api/current/', ...)
└── tablechart/
    ├── settings.py                # Dodany: corsheaders (dev), CORS_ALLOWED_ORIGINS
    └── urls.py                    # Dodany: include chart_app api urls

docker-compose.yml                 # Dodany serwis frontend; web port nie eksponowany zewnetrznie
```

## Complexity Tracking

Brak naruszen constitution — tabela nie wymagana.

---

## Phase 0: Research (Complete)

Wyniki w [research.md](research.md). Wszystkie decyzje architektoniczne podjete:

| # | Decyzja | Wynik |
|---|---------|-------|
| 1 | Bundler | Vite 5.x |
| 2 | Docker serving | Multi-stage Dockerfile: node:20-alpine -> nginx:alpine |
| 3 | Nginx routing | SPA try_files + proxy /api/ -> web:8000 |
| 4 | Nowe endpointy Django | Tylko /api/current/ (pozostale juz JSON) |
| 5 | CORS | django-cors-headers tylko dev; prod same-origin przez nginx |
| 6 | State management | React Context + TanStack Query |
| 7 | Charting | react-apexcharts (reuz istniejacych wykresow) |
| 8 | Kolejnosc migracji | API -> scaffold -> CurrentOccupancy -> HistoricalChart -> Chatbot |
| 9 | Session auth | credentials include + X-Session-Key header |

---

## Phase 1: Design

### Data Model

Szczegoly w [data-model.md](data-model.md).

**Kluczowe typy danych wymieniane miedzy React a Django:**

```
CurrentData {
  date: string[]            # timestamps ISO 8601
  sport: number[]
  family: number[]
  small: number[]
  ice: number[]
  lastdate: string
  lastsport: number
  lastfamily: number
  lastsmall: number
  lastice: number
  sport_percent: number     # 0-100
  family_percent: number
  small_percent: number
  ice_percent: number
  session_id: string
  opening: string | null
}

HistoricalData {
  today: string             # nazwa dnia po polsku
  date_stat: string[]       # godziny HH:MM
  sport_stat: number[]
  family_stat: number[]
  small_stat: number[]
}
```

### API Contracts

Szczegoly w [contracts/api-endpoints.md](contracts/api-endpoints.md).

**Nowy endpoint:**
- `GET /api/current/` — zwraca JSON z biezacymi danymi (odpowiednik content_view)

**Istniejace endpointy reuzywane bez zmian:**
- `GET /update_chart/stats<int:day>` — dane historyczne wg dnia (0=Pon, 6=Nie)
- `GET /get_date_data/?date=YYYY-MM-DD` — dane dla wybranej daty
- `POST /chatbot/api/chat/` — chatbot

### Dockerfile — frontend (nowy)

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf (frontend)

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain application/javascript application/json text/css;

    # SPA routing — wszystkie sciezki do index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy do Django API
    location /api/ {
        proxy_pass http://web:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Proxy istniejacych endpointow
    location /update_chart/ {
        proxy_pass http://web:8000/update_chart/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /get_date_data/ {
        proxy_pass http://web:8000/get_date_data/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Cookie $http_cookie;
    }

    location /chatbot/ {
        proxy_pass http://web:8000/chatbot/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Cookie $http_cookie;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|ico|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### docker-compose.yml — zmiana (delta)

```yaml
services:
  # --- NOWY serwis ---
  frontend:
    build: ./frontend
    container_name: pooltracker-frontend
    depends_on:
      web:
        condition: service_started
    ports:
      - "80:80"
    restart: unless-stopped

  # --- MODYFIKACJA serwisu web ---
  web:
    # USUNAC: ports: "8000:8000"   (web nie eksponuje portu zewnetrznie)
    # ports zostaje tylko w dev przez override docker-compose.dev.yml
```

### Django — nowy endpoint (delta)

```python
# chart_app/views.py - nowa funkcja
@require_GET
def api_current_view(request: HttpRequest) -> JsonResponse:
    """Return current pool occupancy data as JSON."""
    ...zwraca ten sam slownik co content_view ale jako JsonResponse...

# chart_app/urls.py - dodac
path('api/current/', views.api_current_view, name='api_current'),

# tablechart/settings.py - dodac (dev only)
if DEBUG:
    INSTALLED_APPS += ['corsheaders']
    MIDDLEWARE.insert(0, 'corsheaders.middleware.CorsMiddleware')
    CORS_ALLOWED_ORIGINS = ['http://localhost:5173']
```

### Quickstart

Szczegoly w [quickstart.md](quickstart.md).

---

## Constitution Re-Check (post-design)

Wszystkie gates z pre-design pozostaja PASS. Projekt jest zgodny z constitution:
- TDD: Vitest testy dla kazdych komponentow przed implementacja
- UX: Loading spinners, error boundaries, mobile-first responsywnosc
- Performance: nginx gzip, Vite code splitting, istniejace Django cache bez zmian
- Security: CORS wylaczony w produkcji, CSRF przez SameSite cookie, no new secrets
- Docker: multi-stage build, frontend image << 500MB

---

## Out of Scope

- Autentykacja uzytkownikow / logowanie (nie bylo w oryginalnej aplikacji)
- SSR (Server Side Rendering) — pelna SPA wystarczy
- PWA / Service Workers — poza zakresem tej iteracji
- Zmiany w bazie danych lub modelu scrappera