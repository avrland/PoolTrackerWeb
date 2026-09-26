# Research: PostgreSQL Docker Setup & Django Infrastructure Cleanup

**Phase**: 0 (Resolve unknowns from Technical Context)  
**Date**: 2026-04-23  
**Feature**: [plan.md](plan.md)

---

## Pytanie 1: psycopg2 vs psycopg2-binary w kontenerze Docker

**Kontekst**: Dockerfile jest single-stage oparty o `python:3.14.2-slim`. Potrzebujemy sterownika PostgreSQL dla Django.

### Analiza

| | psycopg2 | psycopg2-binary |
|---|---|---|
| Zależności apt | `libpq-dev`, `gcc`, `python3-dev` | Brak |
| Kompilacja przy `pip install` | Tak (C extension) | Nie (precompiled wheel) |
| Rozmiar obrazu (single-stage) | Większy — apt libs zostają w obrazie | Mniejszy — brak dodatkowych apt libs |
| Rozmiar obrazu (multi-stage) | Mniejszy — apt libs odrzucone w stage 2 | Podobny do single-stage |
| Rekomendacja producenta | Dla środowisk produkcyjnych z kontrolą nad bibliotekami | Dla środowisk deweloperskich i kontenerów |

### Decyzja: **psycopg2-binary**

**Uzasadnienie**: Projekt używa single-stage Dockerfile. W tym układzie `psycopg2-binary`:
- Nie wymaga żadnych dodatkowych pakietów `apt-get` (brak `libpq-dev`, `gcc` w warstwie obrazu)
- Jest precompiled wheel — mniejszy i prostszy obraz
- Eliminuje wszystkie zależności systemowe dla MySQL (`default-libmysqlclient-dev`, `gcc`, `pkg-config`) bez dodawania nowych
- Dla skali projektu PoolTrackerWeb (nie krytyczna infrastruktura bankowa) binary jest w pełni odpowiednie

**Alternatywy odrzucone**: psycopg2 z multi-stage build — nadmierna złożoność dla tego projektu.

---

## Pytanie 2: Mechanizm oczekiwania na gotowość PostgreSQL

**Kontekst**: Kontener aplikacji Django startuje szybciej niż baza danych. Bez synchronizacji migracje padają z błędem połączenia.

### Opcje

| Podejście | Opis | Wady |
|-----------|------|------|
| `wait-for-it.sh` / `dockerize` | Zewnętrzny skrypt czekający na port TCP | Wymaga pobrania narzędzia, port TCP ≠ gotowość bazy |
| `pg_isready` w entrypoint.sh pętla | Skrypt bash loopujący aż `pg_isready` zwróci 0 | Reinwencja healthchecka, zaśmieca logi |
| Docker `healthcheck` + `depends_on: condition: service_healthy` | Native Docker Compose — sprawdzanie gotowości wbudowane w orchestrator | Brak |

### Decyzja: **Docker `healthcheck` + `depends_on: condition: service_healthy`**

**Uzasadnienie**:
- Natywne wsparcie Docker Compose — nie wymaga zewnętrznych narzędzi ani dodatkowych warstw w obrazie
- `pg_isready` jest dostępne w obrazie `postgres:16-alpine` (pakiet `postgresql-client` wbudowany)
- Wyraźnie widoczne w `docker compose ps` — health status jest w output
- Konstytucja wymaga health checków (sekcja Deployment)
- `start_period: 10s` eliminuje false-negative podczas inicjalizacji bazy (pierwsze uruchomienie)

**Konfiguracja**:
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 10s
```

---

## Pytanie 3: Obraz PostgreSQL — wersja i wariant

**Kontekst**: Wybór stabilnego, długo wspieranego obrazu PostgreSQL. Priorytet: mały rozmiar obrazu.

### Decyzja: **`postgres:16-alpine`**

| Kryterium | Wartość |
|-----------|---------|
| Wersja | PostgreSQL 16 (LTS) |
| EOL | Listopad 2028 (>2 lata wsparcia) |
| Wariant | Alpine (140 MB vs ~350 MB standard) |
| Tag | `postgres:16-alpine` (floating minor, aktualizuje patch) |

**Uzasadnienie**: PostgreSQL 16 to obecna wersja LTS. Alpine bazuje na musl libc i busybox — znacznie mniejszy obraz niż Debian-based standard. `pg_isready` jest dostępne w obrazie Alpine bez dodatkowych pakietów. Floating minor tag (`16-alpine`, nie `16.3-alpine`) zapewnia automatyczne aktualizacje bezpieczeństwa.

---

## Pytanie 4: Konfiguracja WhiteNoise + Django staticfiles

**Kontekst**: Aktualny problem w `settings.py`:
```python
if DEBUG:
    STATICFILES_DIRS = [BASE_DIR / 'static', BASE_DIR / 'tablechart/static']
else:
    STATIC_ROOT = BASE_DIR / 'static'  # ← CONFLICT: ten sam katalog co źródła
```

### Diagnoza problemu

`collectstatic` czyta pliki z `STATICFILES_DIRS` i zapisuje je do `STATIC_ROOT`. Jeśli `STATIC_ROOT == STATICFILES_DIRS[0]`, Django rzuca błąd:
> `SystemCheckError: STATICFILES_DIRS setting should not contain the STATIC_ROOT setting`

Dodatkowo `STATIC_ROOT` niezdefiniowany w trybie `DEBUG=True` → błąd przy `collectstatic` lokalnie.

### Decyzja: Stały, odrębny `STATIC_ROOT`

```python
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'      # Katalog wyjściowy collectstatic
STATICFILES_DIRS = [BASE_DIR / 'static']    # Źródło — zawsze zdefiniowane
```

**Kluczowe zasady**:
1. `STATIC_ROOT` MUSI być innym katalogiem niż jakikolwiek wpis w `STATICFILES_DIRS`
2. `STATICFILES_DIRS` zdefiniowane zawsze (Django dev server i collectstatic potrzebują go)
3. `staticfiles/` dodany do `.gitignore` (katalog generowany, nie wersjonowany)
4. W trybie `DEBUG=False` WhiteNoise middleware serwuje z `STATIC_ROOT`

**Dlaczego usuwamy `tablechart/static` z STATICFILES_DIRS**: Ten katalog nie istnieje w strukturze projektu (brak w drzewie plików) — był błędnym wpisem. Weryfikacja: brak plików statycznych pod `tablechart/tablechart/static/`.

**WhiteNoise storage backend** (kompresja + manifest): 
```python
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
```
Zapewnia: gzip/brotli kompresję, cache-busting przez hash w nazwie pliku, manifest dla niezmiennych assetów.

**Uwaga**: `django.contrib.staticfiles` musi pozostać w `INSTALLED_APPS` — wymagane przez WhiteNoise i `collectstatic`.

---

## Pytanie 5: Sekwencja startowa kontenera — entrypoint.sh

**Kontekst**: Docker Compose uruchamia skład. Aplikacja musi czekać na bazę, migrować, zebrać assety, a następnie uruchomić Gunicorn.

### Decyzja: Skrypt `entrypoint.sh` z `exec`

```bash
#!/bin/sh
set -e

echo "==> Running Django migrations..."
python manage.py migrate --noinput

echo "==> Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "==> Starting Gunicorn..."
exec gunicorn tablechart.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --log-level info \
    --access-logfile - \
    --error-logfile -
```

**Kluczowe decyzje**:
- `set -e` — skrypt przerywa przy błędzie (migracje fail → Gunicorn nie startuje → kontener pada → Docker Compose restartuje)
- `exec gunicorn` — zastępuje proces powłoki procesem Gunicorn (PID 1), co pozwala na prawidłowe przekazanie sygnałów `SIGTERM`/`SIGINT` (graceful shutdown)
- `--noinput` — migracje i collectstatic nie czekają na potwierdzenie (tryb nieinteraktywny)
- `--clear` przy collectstatic — usuwa stare pliki z `staticfiles/` przed zebraniem (unika nieaktualnych assetów po rename)
- `--access-logfile -` / `--error-logfile -` — logi do stdout/stderr (Docker je zbierze)
- Oczekiwanie na bazę: obsługiwane przez healthcheck + `depends_on`, nie przez skrypt

---

## Pytanie 6: Zmiana silnika bazy danych w settings.py

**Kontekst**: `settings.py` używa `django.db.backends.mysql` i `pymysql` w `INSTALLED_APPS`.

### Decyzja: `django.db.backends.postgresql`

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST', 'db'),   # Nazwa serwisu Docker
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}
```

**Uwagi**:
- `DB_HOST` powinien defaultować do `'db'` — nazwy serwisu PostgreSQL w Docker Compose (Docker DNS)
- `DB_PORT` domyślnie `5432` (standardowy port PostgreSQL)
- `pymysql` usuwa się z `INSTALLED_APPS` — nie jest aplikacją Django, był błędnym wpisem
- `__init__.py` zawiera już zakomentowany `pymysql.install_as_MySQLdb()` — można plik wyczyścić lub zostawić jako jest

---

## Pytanie 7: Które paczki usunąć z requirements.txt

**Aktualny requirements.txt**:
```
python-dotenv, django, mysqlclient, plotly, pandas, whitenoise, requests, pydantic,
langchain, langchain-google-genai, qdrant-client, gunicorn, bleach, django-ratelimit, pymysql
```

### Decyzja o zmianach

| Paczka | Akcja | Powód |
|--------|-------|-------|
| `mysqlclient` | **USUŃ** | Sterownik MySQL, zastąpiony przez psycopg2-binary |
| `pymysql` | **USUŃ** | Alternatywny sterownik MySQL, zastąpiony przez psycopg2-binary |
| `psycopg2-binary` | **DODAJ** | Sterownik PostgreSQL |
| `plotly` | Zostaje | Używany w `chart_app/views.py` (import plotly.express) |
| `pandas` | Zostaje | Używany w `chart_app/views.py` i `chatbot_app/views.py` |
| `bleach` | Zostaje | Używany w `chatbot_app/views.py` (sanityzacja wejścia użytkownika) |
| `pydantic` | Zostaje | Import bezpośredni w `chatbot_app/langchain_utils.py` |
| `requests` | Zostaje | Używany w `chart_app/views.py` |
| `django-ratelimit` | Zostaje | Używany w obu apps jako dekorator widoków |
| `langchain` | Zostaje | Core LangChain |
| `langchain-google-genai` | Zostaje | Integracja Gemini API |
| `qdrant-client` | Zostaje | Wyszukiwarka wektorowa dla chatbota |
| `whitenoise` | Zostaje | Serwowanie plików statycznych |
| `gunicorn` | Zostaje | WSGI server produkcyjny |
| `python-dotenv` | Zostaje | Ładowanie `.env` w `settings.py` |

**Wynik**: Usunięte 2 paczki (`mysqlclient`, `pymysql`), dodana 1 (`psycopg2-binary`).

---

## Podsumowanie decyzji

| Obszar | Decyzja |
|--------|---------|
| Sterownik DB | psycopg2-binary (brak deps apt, single-stage Docker) |
| Obraz PostgreSQL | postgres:16-alpine (LTS, mały rozmiar) |
| Oczekiwanie na DB | Healthcheck `pg_isready` + `depends_on: service_healthy` |
| STATIC_ROOT | `BASE_DIR / 'staticfiles'` (odrębny od źródeł) |
| STATICFILES_DIRS | `[BASE_DIR / 'static']` (zawsze, bez warunku DEBUG) |
| WhiteNoise storage | CompressedManifestStaticFilesStorage |
| Sekwencja startowa | entrypoint.sh: migrate → collectstatic --clear → exec gunicorn |
| Django DB engine | django.db.backends.postgresql |
| DB_HOST default | `'db'` (nazwa serwisu Docker Compose) |
