# Contract: Interfejs Serwisów Docker Compose

**Feature**: 001-postgres-docker-setup  
**Scope**: Specyfikacja serwisów, zależności i woluminów w `docker-compose.yml`

---

## Serwis: `db` (PostgreSQL)

```yaml
db:
  image: postgres:16-alpine
  container_name: pooltracker-db
  environment:
    POSTGRES_DB: ${DB_NAME}
    POSTGRES_USER: ${DB_USER}
    POSTGRES_PASSWORD: ${DB_PASSWORD}
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 10s
  volumes:
    - postgres_data:/var/lib/postgresql/data
  restart: unless-stopped
```

**Gwarantuje**:
- Status `healthy` → baza przyjmuje połączenia na porcie 5432
- Dane w wolumenie `postgres_data` przeżywają restarty i przebudowania obrazu
- Port 5432 NIE jest eksponowany na hosta (dostępny tylko wewnątrz sieci Docker)

---

## Serwis: `web` (Django + Gunicorn)

```yaml
web:
  build: .
  container_name: pooltracker-web
  depends_on:
    db:
      condition: service_healthy
  ports:
    - "80:8000"
  environment:
    - PYTHONDONTWRITEBYTECODE=1
    - PYTHONUNBUFFERED=1
  env_file:
    - .env
  volumes:
    - logs_data:/logs
  restart: unless-stopped
```

**Kontrakt sekwencji startowej** (`entrypoint.sh`):
1. `python manage.py migrate --noinput` — musi zakończyć się kodem 0
2. `python manage.py collectstatic --noinput --clear` — musi zakończyć się kodem 0
3. `exec gunicorn tablechart.wsgi:application --bind 0.0.0.0:8000 --workers 3 ...`

**Gwarantuje**:
- Kontener NIE startuje, dopóki `db` nie jest `healthy`
- Migracje i collectstatic uruchamiają się przy każdym starcie (idempotentne)
- Gunicorn nasłuchuje na `0.0.0.0:8000` i przekazuje sygnały Docker przez `exec`

---

## Wolumeny

```yaml
volumes:
  postgres_data:    # Trwałe dane PostgreSQL
  logs_data:        # Logi aplikacji (istniejący wolumin)
```

---

## Dockerfile: interfejs budowania

**Wymagane w obrazie**:
- `entrypoint.sh` skopiowany do WORKDIR i z uprawnieniami `+x`
- Brak systemowych bibliotek MySQL (`default-libmysqlclient-dev`, `pkg-config`)
- Brak `gcc` (psycopg2-binary nie wymaga kompilacji)
- WORKDIR ustawiony (np. `/app`) — komenda `python manage.py` działa z WORKDIR

**Sekwencja warstw Dockerfile**:
```
FROM python:3.14.2-slim
ENV ... (PYTHONDONTWRITEBYTECODE, PYTHONUNBUFFERED)
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh
EXPOSE 8000
CMD ["/app/entrypoint.sh"]
```

---

## entrypoint.sh: interfejs skryptu

**Wejście** (env vars wymagane przed wykonaniem):
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` — połączenie z bazą
- `SECRET_KEY` — Django wymaga do startu
- `DJANGO_DEBUG=False` — tryb produkcyjny

**Wyjście** (kody zakończenia):
- `0` → Gunicorn uruchomiony poprawnie
- `!=0` → Błąd w migracji lub collectstatic (Docker Compose restartuje kontener)

**Invariant**: Po sukcesie skryptu Gunicorn jest PID 1 procesu kontenera (przez `exec`), co zapewnia poprawny odbiór sygnałów Docker.
