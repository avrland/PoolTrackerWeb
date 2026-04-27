# Implementation Plan: PostgreSQL Docker Setup & Django Infrastructure Cleanup

**Branch**: `001-postgres-docker-setup` | **Date**: 2026-04-23 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/001-postgres-docker-setup/spec.md`

## Summary

Zastąpienie bazy MySQL kontenerem PostgreSQL zarządzanym przez Docker Compose, naprawienie konfiguracji plików statycznych Django (oddzielenie `STATIC_ROOT` od `STATICFILES_DIRS`), oczyszczenie zależności (`mysqlclient`, `pymysql` → `psycopg2-binary`), oraz implementacja skryptu startowego kontenera zapewniającego sekwencję: oczekiwanie na gotowość bazy → migracje → zbieranie assetów → start Gunicorn. Całość uruchamiana jedną komendą `docker compose up --build`.

## Technical Context

**Language/Version**: Python 3.14.2 (Dockerfile base image: `python:3.14.2-slim`)  
**Framework**: Django 4.1.7  
**Primary Dependencies**: Django, Gunicorn, WhiteNoise, psycopg2-binary (zastępuje mysqlclient/pymysql), LangChain, LangChain-Google-Genai, Qdrant-client, Plotly, Pandas, Bleach, Pydantic, Requests, django-ratelimit, python-dotenv  
**Storage**: PostgreSQL 16-alpine (jako kontener Docker; zastępuje zewnętrzny MySQL)  
**Testing**: Django test runner (`python manage.py test`) — testy infrastrukturalne przez smoke test kontenera  
**Target Platform**: Linux Docker container (`python:3.14.2-slim`), za Cloudflare reverse proxy  
**Project Type**: Web application (Django monolith)  
**Performance Goals**: Docker image < 500 MB (Konstytucja IV); API < 500ms p95 (Konstytucja IV)  
**Constraints**: Credentiale wyłącznie przez zmienne env (Konstytucja Security); zero-downtime via healthcheck (Konstytucja Deployment)  
**Scale/Scope**: Zmiana wyłącznie infrastrukturalno-konfiguracyjna; brak nowych funkcjonalności użytkownika

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Zasada | Status | Uzasadnienie |
|--------|--------|--------------|
| **I. Code Quality First** (type hints, docstrings, PEP 8) | ✅ PASS | Brak nowych funkcji Python. Jedyna zmiana kodu: `settings.py` (stałe konfiguracyjne) i `__init__.py` (usunięcie komentarzy). Plik `entrypoint.sh` to skrypt bash — nie podlega zasadzie type hints. |
| **II. Test-Driven Development** (80% coverage, unit tests) | ✅ PASS | Zmiana infrastrukturalna, nie logika aplikacji. Akceptowalne testy: smoke test (`docker compose up`, weryfikacja odpowiedzi HTTP) + weryfikacja logów migracji. Constitution: "Views require integration tests" — brak nowych widoków. |
| **III. User Experience Consistency** (responsive, accessible) | ✅ PASS | Naprawa serwowania assetów bezpośrednio przywraca UX. Brak zmian w UI. |
| **IV. Performance & Scalability** (image < 500 MB, DB < 100ms) | ✅ PASS | Usunięcie zależności MySQL (libs systemowe) i zastąpienie psycopg2-binary (bez deps systemowych) zmniejszy rozmiar obrazu. PostgreSQL na tej samej maszynie Docker — oczekiwane opóźnienie << 100ms. |
| **Security** (env vars, HTTPS) | ✅ PASS | Credentiale PostgreSQL przez zmienne env (`.env`). Brak zakodowanych haseł. |
| **Deployment** (health checks, zero-downtime) | ✅ PASS | Healthcheck `pg_isready` + `depends_on: condition: service_healthy` implementuje wzorzec wymagany przez Konstytucję. |

**Gate Result: PASS** — Brak naruszeń wymagających uzasadnienia. Kontynuuj do Phase 0.

## Post-Design Constitution Check (po Phase 1)

*Re-ocena po wygenerowaniu data-model.md, contracts/ i quickstart.md.*

| Zasada | Status | Zmiana vs pre-design |
|--------|--------|----------------------|
| **I. Code Quality First** | ✅ PASS | `entrypoint.sh` jest bash (nie Python) — poza zakresem type hints. `settings.py` zmiany to stałe, nie funkcje. Brak regresu. |
| **II. TDD** | ✅ PASS | Brak nowej logiki aplikacji. Smoke test (`docker compose up`, weryfikacja HTTP 200) pokrywa SC-001 do SC-005. |
| **III. UX Consistency** | ✅ PASS | `CompressedManifestStaticFilesStorage` dodaje cache-busting hash do nazw plików — nie zmienia URL-i widocznych dla użytkownika, ale może wymagać hard-refresh po wdrożeniu. Akceptowalne. |
| **IV. Performance** | ✅ PASS | psycopg2-binary (brak apt build deps) → mniejszy obraz. Usunięcie MySQL libs (`default-libmysqlclient-dev`, `gcc`, `pkg-config`) → dalsze zmniejszenie. `--clear` w collectstatic usuwa stare pliki → brak zbędnych assetów. |
| **Security** | ✅ PASS | Port 5432 PostgreSQL NIE eksponowany na hosta — dostępny tylko wewnątrz sieci Docker Compose. |
| **Deployment** | ✅ PASS | `healthcheck` + `depends_on: service_healthy` + `restart: unless-stopped` + `exec gunicorn` (graceful shutdown) spełnia wszystkie wymagania Konstytucji. |

**Post-design Gate Result: PASS** — Design nie wprowadza naruszeń. Gotowy do `/speckit.tasks`.

## Project Structure

### Documentation (this feature)

```text
specs/001-postgres-docker-setup/
├── plan.md              # Ten plik
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── environment-variables.md
│   └── service-interface.md
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
tablechart/                          # Katalog projektu Django
├── tablechart/
│   ├── settings.py                  # ZMIANA: engine PG, STATIC_ROOT, STATICFILES_DIRS, usuń pymysql z INSTALLED_APPS
│   └── __init__.py                  # ZMIANA: usuń komentarze pymysql (już zakomentowane)
├── chart_app/                       # Bez zmian
├── chatbot_app/                     # Bez zmian
├── static/                          # Źródłowe pliki statyczne (STATICFILES_DIRS)
├── staticfiles/                     # NOWY katalog wyjściowy (STATIC_ROOT, generowany, nie wersjonowany)
├── templates/                       # Bez zmian
├── requirements.txt                 # ZMIANA: usuń mysqlclient/pymysql, dodaj psycopg2-binary
├── Dockerfile                       # ZMIANA: usuń MySQL apt libs, dodaj WORKDIR, kopiuj entrypoint.sh
├── docker-compose.yml               # ZMIANA: dodaj serwis db, healthcheck, volumes, depends_on
└── entrypoint.sh                    # NOWY: migrate → collectstatic → exec gunicorn

.gitignore                           # ZMIANA: dodaj staticfiles/ (jeśli nie ma)
```

**Structure Decision**: Django monolith (Option 2 uproszczony). Backend w `tablechart/`, brak oddzielnego frontendu. Zmiany dotyczą wyłącznie plików konfiguracyjnych i infrastrukturalnych — żadnych nowych modułów Django.

## Complexity Tracking

> Brak naruszeń Konstytucji — sekcja nie dotyczy.
