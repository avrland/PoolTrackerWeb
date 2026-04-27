---
description: "Task list for PostgreSQL Docker Setup & Django Infrastructure Cleanup"
---

# Tasks: PostgreSQL Docker Setup & Django Infrastructure Cleanup

**Input**: Design documents from `/specs/001-postgres-docker-setup/`  
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅  
**Tests**: Nie dotyczy — zmiana infrastrukturalna; weryfikacja przez smoke test (docker compose up)

**Organization**: Zadania pogrupowane według historii użytkownika (US1→US2→US3), każda niezależnie testowalna.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Można wykonać równolegle (różne pliki, brak wzajemnych zależności)
- **[US1/US2/US3]**: Przynależność do historii użytkownika

---

## Phase 1: Setup (Inicjalizacja)

**Cel**: Tworzenie nowych plików wymaganych przez pozostałe fazy

- [X] T001 Create tablechart/entrypoint.sh — skrypt startowy kontenera: `set -e`, `python manage.py migrate --noinput`, `python manage.py collectstatic --noinput --clear`, `exec gunicorn tablechart.wsgi:application --bind 0.0.0.0:8000 --workers 3 --log-level info --access-logfile - --error-logfile -`
- [X] T002 [P] Create tablechart/.env.example — szablon zmiennych env zgodny z contracts/environment-variables.md: sekcje DB (DB_NAME, DB_USER, DB_PASSWORD, DB_HOST=db, DB_PORT=5432), Django (SECRET_KEY, DJANGO_DEBUG=False), API keys (OPENWEATHER_API_KEY, GEMINI_API_KEY), opcjonalne (DONATION_LIST_PATH, GODMODE_EMAIL, BUYCOFFEE_URL)

---

## Phase 2: Foundational (Blokujące wymagania wstępne)

**Cel**: Podstawowa infrastruktura wymagana zanim którakolwiek historia użytkownika może być zaimplementowana

**⚠️ KRYTYCZNE**: T004 zależy od T001 — `entrypoint.sh` musi istnieć zanim Dockerfile będzie go kopiował

- [X] T003 [P] Update tablechart/requirements.txt — usuń `mysqlclient` i `pymysql`; dodaj `psycopg2-binary` w miejscu sterowników MySQL
- [X] T004 Update tablechart/Dockerfile — usuń blok `apt-get` instalujący MySQL libs (`default-libmysqlclient-dev`, `gcc`, `pkg-config`); dodaj `WORKDIR /app` przed `COPY`; zmień wszystkie ścieżki COPY na relatywne do WORKDIR; dodaj `COPY entrypoint.sh /app/entrypoint.sh` i `RUN chmod +x /app/entrypoint.sh`; zmień `CMD` na `["/app/entrypoint.sh"]`; usuń zbędny `RUN sed -i` manipulujący DEBUG (DEBUG kontrolowany przez env var)

**Checkpoint Foundational**: Obraz buduje się bez błędów (`docker build .`). Brak MySQL zależności.

---

## Phase 3: User Story 1 - Jednokomendowe uruchomienie środowiska (Priority: P1) 🎯 MVP

**Cel**: `docker compose up --build` uruchamia oba kontenery; migracje i collectstatic wykonują się automatycznie; aplikacja dostępna pod portem 80

**Independent Test**: Uruchom `docker compose up --build`, poczekaj na log `Starting Gunicorn`, otwórz `http://localhost` — HTTP 200. Zweryfikuj `docker compose ps` — oba kontenery `Up`.

### Implementacja US1

- [X] T005 [P] [US1] Update tablechart/tablechart/settings.py — sekcja `DATABASES`: zmień `ENGINE` na `'django.db.backends.postgresql'`, dodaj `default='db'` dla `DB_HOST` (`os.getenv('DB_HOST', 'db')`), dodaj `default='5432'` dla `DB_PORT`; w `INSTALLED_APPS` usuń wpis `'pymysql'` (nie jest aplikacją Django); usuń `DEBUG = True` (wartość będzie z env lub domyślna False)
- [X] T006 [P] [US1] Update tablechart/tablechart/__init__.py — usuń zakomentowane linie `# import pymysql` i `# pymysql.install_as_MySQLdb()` (plik może pozostać pusty lub zawierać tylko komentarz modułu)
- [X] T007 [US1] Rewrite tablechart/docker-compose.yml — kompletna nowa wersja pliku: serwis `db` (image: postgres:16-alpine, container_name: pooltracker-db, environment z ${DB_NAME}/${DB_USER}/${DB_PASSWORD}, healthcheck pg_isready z interval/timeout/retries/start_period, volumes postgres_data:/var/lib/postgresql/data, restart: unless-stopped); serwis `web` (build: ., container_name: pooltracker-web, depends_on: db: condition: service_healthy, ports: 80:8000, environment: PYTHONDONTWRITEBYTECODE/PYTHONUNBUFFERED, env_file: .env, volumes: logs_data:/logs, restart: unless-stopped — BEZ pola `command`, CMD zarządza entrypoint.sh); sekcja volumes: postgres_data i logs_data

**Checkpoint US1**: `docker compose up --build` → logi w kolejności: `database system is ready` → `Running Django migrations` → `Collecting static files` → `Booting worker`. Aplikacja dostępna pod http://localhost.

---

## Phase 4: User Story 2 - Poprawne serwowanie assetów w kontenerze (Priority: P2)

**Cel**: Wszystkie pliki CSS i JS ładują się bez błędów 404 w kontenerze produkcyjnym (`DEBUG=False`)

**Independent Test**: Otwórz `http://localhost` w działającym kontenerze, sprawdź zakładkę Network w DevTools — zero odpowiedzi 4xx dla plików statycznych.

### Implementacja US2

- [X] T008 [US2] Update tablechart/tablechart/settings.py — napraw konfigurację staticfiles: ustaw `STATIC_ROOT = BASE_DIR / 'staticfiles'` (poza blokiem `if DEBUG`); zastąp cały blok `if DEBUG: STATICFILES_DIRS / else: STATIC_ROOT` stałym `STATICFILES_DIRS = [BASE_DIR / 'static']` (zawsze aktywne, usuń błędny wpis `BASE_DIR / 'tablechart/static'`); dodaj blok `STORAGES = {'staticfiles': {'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage'}, 'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'}}`
- [X] T009 [P] [US2] Create/update tablechart/.gitignore — dodaj wpis `staticfiles/` (katalog generowany przez collectstatic, nie wersjonowany); jeśli plik nie istnieje utwórz go z tym wpisem plus standardowe wpisy Python (`.env`, `__pycache__/`, `*.pyc`, `*.pyo`)

**Checkpoint US2**: `docker compose up --build` → logi zawierają `X static files copied to '/app/staticfiles'`. Strona ładuje poprawne style i skrypty (brak błędów 404 w DevTools).

---

## Phase 5: User Story 3 - Oczyszczenie zależności projektu (Priority: P3)

**Cel**: Brak śladów MySQL w obrazie Docker i konfiguracji; requirements.txt zawiera tylko aktywne zależności

**Independent Test**: `docker build .` kończy się bez błędów i nie instaluje MySQL libs. `docker compose up --build` → aplikacja startuje bez `ModuleNotFoundError`.

### Implementacja US3

- [X] T010 [P] [US3] Create tablechart/.dockerignore — wyklucz z kontekstu budowania: `staticfiles/`, `**/__pycache__`, `**/*.pyc`, `**/*.pyo`, `.env`, `.git`, `specs/`, `*.md` (zmniejsza kontekst build, przyspiesza `docker build`)
- [X] T011 [US3] Scan tablechart/ for remaining MySQL references — przeszukaj cały katalog pod kątem pozostałości: sprawdź `settings.py` (brak `mysql` w ENGINE, brak `pymysql` w INSTALLED_APPS po T005), `__init__.py` (pusty po T006), `requirements.txt` (brak `mysqlclient`/`pymysql` po T003), `Dockerfile` (brak MySQL apt packages po T004); usuń wszystkie znalezione referencje

**Checkpoint US3**: `grep -r "mysql\|pymysql\|mysqlclient" tablechart/` (poza plikami .md) — zero wyników.

---

## Phase 6: Polish & Cross-Cutting

**Cel**: Dokumentacja i finalne porządki

- [X] T012 [P] Update README.md (root) — dodaj lub zaktualizuj sekcję "Docker Setup": wymagania wstępne (Docker Desktop), instrukcja pierwszego uruchomienia (`cp .env.example .env` → edytuj `.env` → `docker compose up --build`), komendy reset (`docker compose down -v`), wskazanie na `specs/001-postgres-docker-setup/quickstart.md` po szczegóły troubleshooting

---

## Dependencies & Execution Order

### Zależności między fazami

- **Phase 1 (Setup)**: Brak zależności — start natychmiastowy
- **Phase 2 (Foundational)**: T004 zależy od T001 (entrypoint.sh musi istnieć przed Dockerfile COPY)
- **Phase 3 (US1)**: Zależy od ukończenia Phase 1 i Phase 2
- **Phase 4 (US2)**: T008 dotyka tego samego pliku `settings.py` co T005 — musi być po T005
- **Phase 5 (US3)**: T011 weryfikuje wyniki T003, T004, T005, T006 — musi być ostatni
- **Phase 6 (Polish)**: Zależy od ukończenia wszystkich historii użytkownika

### Zależności między historiami użytkownika

- **US1 (P1)**: Zależy od Foundational (Phase 2). Brak zależności od US2/US3.
- **US2 (P2)**: Zależy od Foundational + T005 (settings.py musi być edytowane sekwencyjnie). Niezależna od US3.
- **US3 (P3)**: T010 niezależny od US1/US2. T011 weryfikuje wyniki całej reszty — ostatni w kolejności.

### Wewnątrz historii użytkownika

- US1: T005 i T006 mogą być równoległe (różne pliki); T007 po T005/T006 (logicznie kompletny)
- US2: T008 → T009 (T009 jest niezależny, ale T008 musi zmienić settings.py najpierw dla checkpoint)
- US3: T010 i T011 niezależne; T011 wymaga ukończenia T003/T004/T005/T006

---

## Parallel Opportunities

### Phase 1
```
T001 (entrypoint.sh)  ←→  T002 [P] (.env.example)
```

### Phase 2
```
T003 [P] (requirements.txt)  ←→  po T001: T004 (Dockerfile)
```

### Phase 3 (US1) — po zakończeniu Phase 2
```
T005 [P] (settings.py DB)  ←→  T006 [P] (__init__.py)  ←→  T007 [P] (docker-compose.yml)
         wszystkie trzy dotyczą różnych plików → pełny parallelizm
```

### Phase 4 (US2) — po T005
```
T008 (settings.py static)  →  T009 [P] (.gitignore)  ← równolegle z T008
```

### Phase 5 (US3) — po Phase 3 + Phase 4
```
T010 [P] (.dockerignore)  ←→  T011 (scan MySQL refs)  ← równolegle
```

---

## Implementation Strategy

### MVP (Minimalna wartość: działające środowisko)

**MVP = Phase 1 + Phase 2 + Phase 3 (T001–T007)**

Po ukończeniu T007 masz działające środowisko Docker Compose z PostgreSQL, automatycznymi migracjami i Gunicorn. To dostarcza US1 w całości.

### Inkrementalna dostawa

1. **Iteracja 1** (MVP): T001 → T002 → T003 → T004 → T005+T006+T007 = działające `docker compose up`
2. **Iteracja 2** (Assety): T008 → T009 = poprawne CSS/JS w przeglądarce
3. **Iteracja 3** (Cleanup): T010 → T011 = czysty obraz bez MySQL
4. **Iteracja 4** (Docs): T012 = zaktualizowane README

---

## Summary

| Metryka | Wartość |
|---------|---------|
| Łączna liczba zadań | 12 |
| Phase 1 (Setup) | 2 zadania |
| Phase 2 (Foundational) | 2 zadania |
| Phase 3 – US1 (P1) | 3 zadania |
| Phase 4 – US2 (P2) | 2 zadania |
| Phase 5 – US3 (P3) | 2 zadania |
| Phase 6 (Polish) | 1 zadanie |
| Zadania równoległe [P] | 7 z 12 (58%) |
| MVP scope | T001–T007 (7 zadań) |

### Kryteria niezależnego testowania

| Historia | Kryterium |
|----------|-----------|
| **US1** | `docker compose up --build` → HTTP 200 na `http://localhost`, logi show migrate OK |
| **US2** | DevTools Network → zero 4xx dla plików `/static/*` |
| **US3** | `grep -r "mysql" tablechart/` (bez .md) → zero wyników; obraz buduje się bez MySQL libs |
