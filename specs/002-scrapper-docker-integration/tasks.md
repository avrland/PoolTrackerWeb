# Tasks: Integracja modułu Scrapper z Docker Compose i wspólną bazą PostgreSQL

**Input**: Design documents from `/specs/002-scrapper-docker-integration/`  
**Branch**: `002-scrapper-docker-integration`  
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

---

## Format: `[ID] [P?] [Story?] Opis z ścieżką pliku`

- **[P]** — zadanie może być wykonane równolegle (różne pliki, brak zależności od niegotowych zadań)
- **[US#]** — historia użytkownika, której dotyczy zadanie
- Brak [US#] = zadanie Setup, Foundational lub Polish

---

## Phase 1: Setup

**Purpose**: Konfiguracja środowiska — jeden punkt konfiguracji dla wszystkich serwisów

- [x] T001 [P] Upewnij się, że `.env` jest w `.gitignore` w katalogu głównym projektu (plik root `.gitignore`)
- [x] T002 [P] Utwórz `.env.example` w katalogu głównym projektu z wszystkimi wymaganymi zmiennymi zgodnie z `specs/002-scrapper-docker-integration/contracts/environment-variables.md` (sekcje: DB, Django, Scrapper, Backup)

---

## Phase 2: Foundational (Blokuje US1, US3, US4)

**Purpose**: Przeniesienie docker-compose do roota — prerequisite dla każdego zadania modyfikującego orchestrację

**⚠️ CRITICAL**: Żadna praca nad US1 / US3 / US4 nie może się rozpocząć przed ukończeniem tej fazy

- [x] T003 Utwórz `docker-compose.yml` w katalogu głównym projektu: przenieś zawartość z `tablechart/docker-compose.yml`, zaktualizuj `build.context` serwisu `web` na `./tablechart`, zaktualizuj ścieżkę wolumenu initdb na `./tablechart/initdb` — istniejące serwisy `db` i `web` muszą działać tak jak dotychczas

**Checkpoint**: `docker compose up -d` z roota powinno uruchamiać serwisy `db` i `web` identycznie jak wcześniej

---

## Phase 3: User Story 2 + User Story 1 — Integracja scrapera jako serwisu Docker (Priority: P1) 🎯 MVP

**Goal**: Scrapper działa jako kontener Docker, zbiera dane do PostgreSQL co 15 minut, system startuje jednym poleceniem z katalogu głównego

**Independent Test**: `docker compose up -d` z roota → trzy serwisy (`db`, `web`, `scrapper`) uruchamiają się bez błędów → logi scrapera zawierają `Scheduler started.` → po 15 minutach w bazie pojawia się rekord w tabeli `poolStats`

### Implementacja US2 — Przepisanie kodu scrapera [można równolegle z T003]

- [x] T004 [P] [US2] Zaktualizuj `scrapper/requirements.txt`: usuń `mysql-connector-python`, dodaj `psycopg2-binary`, zachowaj `requests` i `schedule`
- [x] T005 [P] [US2] Zaktualizuj `scrapper/Dockerfile`: zmień obraz bazowy z `python:3.8-slim` na `python:3.11-slim`, dodaj `RUN apt-get update && apt-get install -y --no-install-recommends tzdata && rm -rf /var/lib/apt/lists/*`
- [x] T006 [US2] Przepisz `scrapper/db_handler.py`: zastąp `mysql.connector` przez `psycopg2`, odczytuj parametry połączenia z zmiennych środowiskowych `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (usuń odczyt `db_config.json`), obsługuj `psycopg2.Error` zamiast `mysql.connector.Error`, dodaj type hints do wszystkich funkcji i docstrings (Constitution Principle I)

### Implementacja US1 — Dodanie serwisu scrapper do docker-compose.yml [depends on T003 + T006]

- [x] T007 [US1] Dodaj serwis `scrapper` do `docker-compose.yml`: `build: ./scrapper`, `container_name: pooltracker-scrapper`, `depends_on: db: condition: service_healthy`, `env_file: - .env`, `environment: - TZ=Europe/Warsaw`, `restart: unless-stopped`

**Checkpoint**: `docker compose up -d` → 3 serwisy `healthy`/`running`, logi scrapera: `Scheduler started.`, po 15 min: `SELECT COUNT(*) FROM "poolStats"` zwraca co najmniej 1 rekord

---

## Phase 4: User Story 3 — Współdzielona konfiguracja środowiska (Priority: P2)

**Goal**: Jeden plik `.env` wystarczy do konfiguracji wszystkich serwisów; brak oddzielnych plików konfiguracyjnych z credentials

**Independent Test**: Zmiana `DB_PASSWORD` w `.env` i `docker compose up -d` → zarówno `web`, jak i `scrapper` łączą się z bazą z nowym hasłem bez modyfikacji kodu

- [x] T008 [P] [US3] Usuń `scrapper/db_config.json` i `scrapper/db_config_example.json` — zastąpione przez zmienne środowiskowe
- [x] T009 [US3] Usuń `tablechart/docker-compose.yml` — zastąpiony przez `docker-compose.yml` w katalogu głównym

**Checkpoint**: Repozytorium nie zawiera plików z credentials (`db_config*.json`), docker-compose jest tylko w roota

---

## Phase 5: User Story 4 — Cykliczny backup bazy danych (Priority: P2)

**Goal**: Automatyczny tygodniowy backup bazy do folderu `./backups/` na hoście z rotacją plików

**Independent Test**: `docker compose exec backup /bin/sh -c "/backup.sh"` → w `./backups/` na hoście pojawia się plik `*.sql.gz` z aktualną datą w nazwie; `gunzip -c ./backups/*.sql.gz | docker compose exec -T db psql -U $DB_USER -d $DB_NAME` przebiega bez błędów

- [x] T010 [P] [US4] Uzupełnij `.env.example` o zmienne backupu: `SCHEDULE=@weekly`, `BACKUP_KEEP_DAYS=30`, `BACKUP_KEEP_WEEKS=4` (zgodnie z `specs/002-scrapper-docker-integration/contracts/environment-variables.md`)
- [x] T011 [US4] Dodaj serwis `backup` do `docker-compose.yml`: `image: prodrigestivill/postgres-backup-local`, `container_name: pooltracker-backup`, `depends_on: db: condition: service_healthy`, `env_file: - .env`, zmienne środowiskowe: `POSTGRES_HOST=db`, `POSTGRES_DB=${DB_NAME}`, `POSTGRES_USER=${DB_USER}`, `POSTGRES_PASSWORD=${DB_PASSWORD}`, `SCHEDULE=${SCHEDULE:-@weekly}`, `BACKUP_KEEP_DAYS=${BACKUP_KEEP_DAYS:-30}`, `BACKUP_KEEP_WEEKS=${BACKUP_KEEP_WEEKS:-4}`, wolumen: `./backups:/backups`, `restart: unless-stopped`

**Checkpoint**: `docker compose exec backup /bin/sh -c "/backup.sh"` → plik `*.sql.gz` w `./backups/`, testowe przywrócenie kończy się bez błędów

---

## Final Phase: Polish & Cross-cutting Concerns

- [x] T012 [P] Zaktualizuj `README.md` w katalogu głównym: dodaj sekcję quickstart — instrukcja od sklonowania repo do `docker compose up -d`, opis zmiennych w `.env.example`, polecenie weryfikacji backupu (zgodnie z `specs/002-scrapper-docker-integration/quickstart.md`)
- [x] T013 [P] Dodaj komentarz `# TODO: testy jednostkowe scrapera` w nagłówku `scrapper/db_handler.py`

---

## Dependencies

```
T001 ──────────────────────────────────────────── (brak blokowania)
T002 ──────────────────────────────────────────── (brak blokowania)
T003 ──────────────┬──────────────────────────── blokuje T007, T009, T011
                   │
T004 ──┐           │
T005 ──┤ → T006 ───┴─────────────────────────── T006 blokuje T007
T006 ──┘
                   T007 ─────────────────────── US1 complete
T008 ──────────────────────────────────────────── (zależny od T006: brak już imports mysql)
T009 ──────────────────────────────────────────── (zależny od T003: nowy compose istnieje)
T010 ──────────────────────────────────────────── (brak blokowania)
T011 ──────────────────────────────────────────── (zależny od T003: compose w roota)
T012, T013 ─────────────────────────────────────── Polish (po wszystkich powyższych)
```

## Parallel Execution Examples

**Krok 1** — Wszystkie równolegle:
- T001 (gitignore), T002 (.env.example szkielet), T003 (docker-compose root), T004 (requirements.txt), T005 (Dockerfile)

**Krok 2** — Po T004+T005:
- T006 (db_handler.py rewrite)

**Krok 3** — Po T003+T006:
- T007 (dodanie scrappera do compose)

**Krok 4** — Równolegle po T007:
- T008 (usuń db_config.json), T009 (usuń tablechart compose), T010 (backup vars w .env.example), T011 (dodanie serwisu backup do compose)

**Krok 5** — Polish:
- T012 (README), T013 (TODO tech debt)

## Implementation Strategy (MVP First)

**MVP (US1 + US2 — Phase 1–3)**: T001–T007 — uruchomienie systemu jednym poleceniem z działającym scraperem zbierającym dane do PostgreSQL

**Increment 2 (US3 — Phase 4)**: T008–T009 — czyszczenie i weryfikacja współdzielonej konfiguracji

**Increment 3 (US4 — Phase 5)**: T010–T011 — backup tygodniowy

**Polish**: T012–T013 — dokumentacja i oznaczenie tech debt

---

## Summary

| Metryka | Wartość |
|---------|---------|
| Łączna liczba zadań | 13 |
| US1 (Uruchomienie systemu) | 1 task (T007) |
| US2 (Zbieranie danych) | 3 tasks (T004–T006) |
| US3 (Wspólna konfiguracja) | 2 tasks (T008–T009) |
| US4 (Backup) | 2 tasks (T010–T011) |
| Setup/Foundational/Polish | 5 tasks (T001–T003, T012–T013) |
| Zadania równoległe [P] | 8 |
| MVP scope | T001–T007 (Phase 1–3) |
