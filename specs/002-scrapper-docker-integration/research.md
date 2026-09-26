# Research: Integracja Scrapper z Docker Compose + PostgreSQL

**Phase 0 Output** | Branch: `002-scrapper-docker-integration` | Date: 2026-04-27

---

## 1. Migracja adaptera bazy danych: MySQL → PostgreSQL

**Decision**: Przepisanie `scrapper/db_handler.py` z `mysql-connector-python` na `psycopg2-binary`.

**Rationale**:
- Aplikacja Django już używa PostgreSQL 16 z `psycopg2`; stosowanie tego samego adaptera eliminuje dodatkową zależność.
- `psycopg2-binary` jest samowystarczalnym kołem (bundled libpq) — nie wymaga instalacji systemowych bibliotek C w Dockerze, co upraszcza Dockerfile.
- `mysql-connector-python` nie jest kompatybilne z PostgreSQL; próba zachowania oryginalnego adaptera wymagałaby utrzymywania dwóch różnych backendów bazy danych.
- Interfejs API psycopg2 (DB-API 2.0) jest praktycznie identyczny z mysql-connector, więc migracja kodu jest minimalna (inne klasy wyjątków, inne placeholder w SQL: `%s` → `%s` — takie same!).

**Alternatives considered**:
- `asyncpg` — async, ale scrapper używa synchronicznego `schedule`, brak potrzeby async I/O.
- `SQLAlchemy` — nadmiarowe dla prostego INSERT; dodałoby zależność i złożoność.

**Konkretne zmiany w kodzie**:
```python
# PRZED (mysql)
import mysql.connector
mydb = mysql.connector.connect(**config)

# PO (psycopg2)
import psycopg2
conn = psycopg2.connect(
    host=os.environ['DB_HOST'],
    dbname=os.environ['DB_NAME'],
    user=os.environ['DB_USER'],
    password=os.environ['DB_PASSWORD']
)
```

---

## 2. Konfiguracja połączenia przez zmienne środowiskowe (zamiast `db_config.json`)

**Decision**: Usunąć `db_config.json` i odczytywać wszystkie parametry połączenia z zmiennych środowiskowych (spójne z Django).

**Rationale**:
- Konstytucja projektu wymaga: "Environment variables for all secrets (DB credentials, API keys)".
- Docker Compose umożliwia przekazanie zmiennych z pliku `.env` do wielu serwisów jednocześnie; scrapper dostaje te same zmienne co Django bez duplikowania konfiguracji.
- Eliminuje plik `db_config.json` (a więc i ryzyko przypadkowego commitowania danych uwierzytelniających do repozytorium).

**Zmienne środowiskowe** (zgodne z Django `settings.py`):
| Zmienna | Opis | Wartość domyślna |
|---------|------|-----------------|
| `DB_HOST` | Adres hosta bazy danych (nazwa serwisu w Docker Compose) | `db` |
| `DB_NAME` | Nazwa bazy danych | — |
| `DB_USER` | Użytkownik bazy danych | — |
| `DB_PASSWORD` | Hasło do bazy danych | — |

**Alternatives considered**:
- Zachowanie `db_config.json` montowanego jako Docker volume — komplikuje wdrożenie i nadal trzyma sekrety w plikach.
- Osobny plik `.env` tylko dla scrapera — niepotrzebna duplikacja; wszystkie zmienne są już w głównym `.env`.

---

## 3. Przeniesienie `docker-compose.yml` do katalogu głównego

**Decision**: Przenieść `tablechart/docker-compose.yml` → `docker-compose.yml` (root), zaktualizować build contexts i volume paths.

**Rationale**:
- Plik orkiestracji wielousługowej powinien znajdować się na poziomie projektu, nie w katalogu jednego z serwisów.
- Umożliwia uruchomienie `docker compose up` z roota bez flag `-f`.
- Poprawna konfiguracja `build.context` dla każdego serwisu eliminuje błędy relatywnych ścieżek.

**Wymagane zmiany ścieżek po przeniesieniu**:
| Element | Przed (względem `tablechart/`) | Po (względem root) |
|---------|--------------------------------|-------------------|
| `web` build context | `.` | `./tablechart` |
| `initdb` volume | `./initdb` | `./tablechart/initdb` |
| `scrapper` build context | N/A (nowy) | `./scrapper` |

**Alternatives considered**:
- Użycie `docker compose -f tablechart/docker-compose.yml` — działa, ale jest nieintuicyjne i nie spełnia FR-002.
- Tworzenie osobnego `docker-compose.yml` w rooting i `include` — nadmiarowe dla 3 serwisów.

---

## 4. Obsługa strefy czasowej w kontenerze scrapera

**Decision**: Ustawić zmienną środowiskową `TZ=Europe/Warsaw` w serwisie `scrapper` w Docker Compose.

**Rationale**:
- Obecny kod scrapera używa `time.localtime().tm_isdst` do wykrywania czasu letniego — polega na systemowej strefie czasowej kontenera.
- Domyślna strefa czasowa kontenera Docker to UTC; bez `TZ=Europe/Warsaw` znaczniki czasu zapisywane do bazy byłyby w UTC, co zaburza prezentację danych w aplikacji webowej.
- Ustawienie `TZ` jest najlżejszą zmianą — nie wymaga modyfikacji kodu Python, tylko konfiguracji Docker Compose.

**Alternatives considered**:
- Przepisanie obsługi czasu na `pytz`/`zoneinfo` z jawnym `timezone.now()` — lepsze długoterminowo, ale poza zakresem tej integracji.
- Instalacja pakietu `tzdata` w Dockerfie — niepotrzebne przy ustawieniu `TZ`; Python 3.11 `zoneinfo` korzysta z IANA timezone database dostępnej w `slim` images przez `tzdata` apt package.

**Uwaga**: Dla Python 3.11-slim na Debianie potrzebny jest pakiet systemowy `tzdata` aby `TZ=Europe/Warsaw` działał poprawnie (alternatywnie: `pip install tzdata`).

---

## 5. Healthcheck i kolejność uruchamiania

**Decision**: Scrapper używa `depends_on: db: condition: service_healthy` — identycznie jak serwis `web`.

**Rationale**:
- Baza danych musi być gotowa (PostgreSQL akceptuje połączenia) zanim scrapper spróbuje zapisać dane.
- Mechanizm `healthcheck` dla serwisu `db` jest już zdefiniowany w istniejącym `docker-compose.yml` (`pg_isready`).
- Brak dependency_on może powodować błędy połączenia przy starcie systemu (`connection refused`).

**Alternatives considered**:
- Logika retry w skrypcie scrapera (`time.sleep` + pętla) — możliwe, ale duplikuje funkcję healthcheck Docker Compose.
- `restart: on-failure` bez `depends_on` — nie gwarantuje kolejności startowania.

---

## 6. Wersja Python w Dockerfile scrapera

**Decision**: Zaktualizować `python:3.8-slim` → `python:3.11-slim` w `scrapper/Dockerfile`.

**Rationale**:
- Python 3.8 osiągnie EOL (End of Life) w październiku 2024 (już minął). Brak poprawek bezpieczeństwa.
- `psycopg2-binary` 2.9.x wymaga Python ≥ 3.8, ale oficjalnie zalecany jest 3.10+.
- Spójność z bazowym obrazem `python:3.14.2-slim` stosowanym przez serwis `web` (Dockerfile tablechart).
- `schedule` 1.x działa z Python 3.11 bez zmian.

**Alternatives considered**:
- Zachowanie Python 3.8 — aktywna luka bezpieczeństwa w obrazie bazowym.
- Python 3.12+ — bez znanych problemów, ale 3.11 jest LTS i szeroko przetestowany.

---

---

## 7. Cykliczny backup bazy danych PostgreSQL

**Decision**: Dedykowany kontener `backup` oparty na obrazie `prodrigestivill/postgres-backup-local` z harmonogramem cron `@weekly` i retencją 30 dni. Pliki backupu zapisywane do wolumenu hosta (bind mount).

**Rationale**:
- Obraz `prodrigestivill/postgres-backup-local` to dedykowane rozwiązanie dla PostgreSQL w Docker Compose: obsługuje `pg_dump`, kompresję gzip, cykliczne wykonywanie (cron wewnętrzny), automatyczną rotację plików (retencja) i nazewnictwo plików ze znacznikiem czasu — wszystkie wymagania FR-010–FR-014 z jednej konfiguracji.
- Alternatywa własnoręczna (skrypt shell + crond w alpine) wymagałaby pisania i testowania logiki retencji od zera.
- Wolumen hosta (bind mount) zamiast named volume — pliki backupu muszą być dostępne bezpośrednio na maszynie hosta bez dodatkowych poleceń `docker cp`.
- Format wyjściowy: `.sql.gz` (standardowy dump PostgreSQL + gzip) — przywracalny przez `gunzip | psql` bez dodatkowego oprogramowania.

**Konfiguracja kluczowych zmiennych środowiskowych obrazu**:
| Zmienna | Wartość | Opis |
|---------|---------|------|
| `POSTGRES_HOST` | `db` | Nazwa serwisu bazy w Docker Compose |
| `POSTGRES_DB` | `${DB_NAME}` | Przejęte ze wspólnego `.env` |
| `POSTGRES_USER` | `${DB_USER}` | Przejęte ze wspólnego `.env` |
| `POSTGRES_PASSWORD` | `${DB_PASSWORD}` | Przejęte ze wspólnego `.env` |
| `SCHEDULE` | `@weekly` | Harmonogram cron (raz w tygodniu) |
| `BACKUP_KEEP_DAYS` | `30` | Retencja: usuwa pliki starsze niż 30 dni |
| `BACKUP_KEEP_WEEKS` | `4` | Przechowuje tygodniowe backupy z ostatnich 4 tygodni |

**Ścieżka na hoście**: konfigurowana przez administratora w `docker-compose.yml` jako bind mount, np. `./backups:/backups`. Folder `backups/` tworzony automatycznie przez Docker jeśli nie istnieje.

**Naming plików backupu**: `pooltracker-YYYY-MM-DDTHH-MM-SS.sql.gz` — zawiera znacznik czasu (FR-012).

**Alternatives considered**:
- `pg_dump` w cronjob wewnątrz kontenera `db` — modyfikuje oficjalny obraz bazy, utrudnia upgrade.
- Skrypt powłoki w osobnym `alpine` kontenerze + `cron` — wymaga pisania logiki rotacji plików, obsługi błędów, testowania.
- Named volume zamiast bind mount — dane backupu byłyby wewnątrz Docker, niedostępne bezpośrednio dla administratora hosta.
- Backup co noc zamiast co tydzień — generuje więcej plików, nie jest wymagane przy niskiej częstotliwości zapisu.

---

## Podsumowanie decyzji projektowych

| Obszar | Decyzja | Pliki do zmiany |
|--------|---------|-----------------|
| Adapter DB | psycopg2-binary | `scrapper/db_handler.py`, `scrapper/requirements.txt` |
| Konfiguracja | Zmienne środowiskowe | `scrapper/db_handler.py` (usuń `db_config.json`) |
| Docker Compose | Root-level | `docker-compose.yml` (nowy w root), usunąć `tablechart/docker-compose.yml` |
| Strefa czasowa | `TZ=Europe/Warsaw` | `docker-compose.yml` (env scrapera) + `tzdata` w Dockerfile |
| Python version | 3.11-slim | `scrapper/Dockerfile` |
| Healthcheck | `depends_on: service_healthy` | `docker-compose.yml` (scrapper + backup service) |
| Backup bazy | `prodrigestivill/postgres-backup-local` | `docker-compose.yml` (nowy serwis `backup`), bind mount `./backups` |
