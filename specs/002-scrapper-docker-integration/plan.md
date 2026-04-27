# Implementation Plan: Integracja modułu Scrapper z Docker Compose i wspólną bazą PostgreSQL

**Branch**: `002-scrapper-docker-integration` | **Date**: 2026-04-27 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/002-scrapper-docker-integration/spec.md`

## Summary

Integracja istniejącego modułu `scrapper/` z ekosystemem Docker Compose aplikacji. Główne zmiany: (1) przeniesienie `docker-compose.yml` z `tablechart/` do katalogu głównego projektu, (2) przepisanie `scrapper/db_handler.py` z MySQL na PostgreSQL z konfiguracją przez zmienne środowiskowe, (3) dodanie usługi `scrapper` do Docker Compose z tą samą bazą danych co Django, (4) dodanie usługi `backup` realizującej tygodniowy cykliczny backup bazy do folderu na hoście z automatyczną rotacją plików (retencja 30 dni). Nie jest wymagana zmiana schematu bazy — tabela `poolStats` już istnieje i jest kompatybilna.

## Technical Context

**Language/Version**: Python 3.11 (web Django), Python 3.11-slim (scrapper — upgrade z 3.8)  
**Primary Dependencies**: Django 4.x + Gunicorn (web), psycopg2-binary (scrapper), schedule (scrapper), Docker Compose v3.8, prodrigestivill/postgres-backup-local (backup)  
**Storage**: PostgreSQL 16 Alpine — wspólna instancja dla obu usług; backupy na bind mount hosta  
**Testing**: `python manage.py test` (Django), brak testów dla scrapera (zgodnie z TDD konstytucji — gap do uzupełnienia w osobnym zadaniu)  
**Target Platform**: Linux container (Docker)  
**Project Type**: Multi-service web application (docker-compose z db + web + scrapper + backup)  
**Performance Goals**: Scrapper: zapis do bazy < 500ms; web: bez zmian (spec 001); backup: wykonanie < 5 min (przy rozmiarze bazy < kilkudziesiąt MB)  
**Constraints**: Scrapper MUSI korzystać z tej samej bazy co Django (bez osobnej instancji); Docker image scrapper < 200MB; backupy na bind mount hosta (dostępne poza Dockerem)  
**Scale/Scope**: 4 usługi w jednym docker-compose.yml; ~4 zapisy/h do bazy; 1 backup/tydzień

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality First | ⚠️ PARTIAL | `scrapper/db_handler.py` nie ma type hints ani docstrings. Nowa wersja MUSI je zawierać. |
| II. Test-Driven Development | ⚠️ GAP | Scrapper nie ma żadnych testów. Nowe pliki MUSZĄ mieć testy jednostkowe (min. 80% coverage). Uzasadnienie poniżej. |
| III. User Experience Consistency | ✅ PASS | Nie dotyczy (usługa backendowa bez UI). |
| IV. Performance & Scalability | ✅ PASS | Zapis co 15 min, minimalne obciążenie. Docker image scrapper < 200MB (slim base). |
| Security | ✅ PASS | Zmiana z pliku `db_config.json` na zmienne środowiskowe — zgodne z wymogiem. |
| Deployment | ✅ PASS | Healthcheck na `db` zapewnia zero-downtime ordering. |

**Uzasadnienie odchylenia od TDD (Zasada II)**:

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Brak testów dla scrapera w tym PR | Scrapper pochodzi z zewnętrznego repo bez historii testów; integracja wymaga zmiany adaptera DB (MySQL → PostgreSQL) i jest jednorazowa. Pisanie testów harness dla zewnętrznego API przed integracją wymaga mockowania całego stacku HTTP+DB jednocześnie. | Osobna historia (test harness dla scrapera) nie blokuje tej integracji. Plik `TODO: testy scrapera` zostanie dodany do tasks.md jako oddzielne zadanie P2. |

## Project Structure

### Documentation (this feature)

```text
specs/002-scrapper-docker-integration/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── environment-variables.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
PoolTrackerWeb_avrland/
├── docker-compose.yml          # PRZENIESIONY z tablechart/ — orkiestrator 4 usług
├── .env                        # Zmienne środowiskowe (DB creds, Django secret key)
├── backups/                    # NOWY folder na hoście (bind mount) — pliki *.sql.gz
│
├── scrapper/
│   ├── Dockerfile              # ZAKTUALIZOWANY: python:3.11-slim
│   ├── requirements.txt        # ZAKTUALIZOWANY: psycopg2-binary zamiast mysql-connector-python
│   ├── scrapper.py             # BEZ ZMIAN (logika scrapowania)
│   └── db_handler.py           # PRZEPISANY: psycopg2 + env vars zamiast mysql + db_config.json
│
└── tablechart/
    ├── Dockerfile              # BEZ ZMIAN
    ├── entrypoint.sh           # BEZ ZMIAN
    ├── initdb/
    │   └── poolStats.sql       # BEZ ZMIAN (schemat już zgodny z PostgreSQL)
    └── tablechart/
        └── settings.py        # BEZ ZMIAN (już korzysta z env vars DB_*)
```

**Structure Decision**: Multi-service project. `docker-compose.yml` przeniesiony do roota, build contexts zaktualizowane do `./tablechart` i `./scrapper`. Wspólna sieć Docker umożliwia `scrapper` i `backup` łączenie się z bazą przez nazwę serwisu `db`. Folder `backups/` montowany jako bind mount — dostępny bezpośrednio na hoście.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Brak testów jednostkowych scrapera | Scrapper pochodzi z zewnętrznego repo bez infrastruktury testowej; integracja jest jednorazową migracją adaptera DB | Dodanie testów harness dla HTTP mock + DB mock w tym samym PR zwiększyłoby scope 3x; zostanie uwzględnione w osobnym zadaniu |
