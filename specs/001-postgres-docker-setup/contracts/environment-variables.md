# Contract: Zmienne Środowiskowe

**Feature**: 001-postgres-docker-setup  
**Scope**: Interfejs między plikiem `.env` a kontenerami Docker Compose

---

## Plik `.env` — wymagane zmienne

Plik `.env` MUSI znajdować się w katalogu `tablechart/` (obok `docker-compose.yml`). Nie jest wersjonowany w repozytorium.

### Zmienne bazy danych (PostgreSQL)

| Zmienna | Opis | Przykładowa wartość | Wymagana |
|---------|------|---------------------|----------|
| `DB_NAME` | Nazwa bazy danych PostgreSQL | `pooltracker` | Tak |
| `DB_USER` | Użytkownik bazy danych | `pooltracker_user` | Tak |
| `DB_PASSWORD` | Hasło użytkownika bazy | `supersecret123` | Tak |
| `DB_HOST` | Host bazy danych | `db` (domyślnie = nazwa serwisu Docker) | Tak |
| `DB_PORT` | Port bazy danych | `5432` | Tak |

**Ważne**: `DB_HOST=db` — wartość `db` odpowiada nazwie serwisu PostgreSQL w `docker-compose.yml`. Docker Compose tworzy wewnętrzny DNS rozwiązujący `db` na adres IP kontenera.

### Zmienne aplikacji Django

| Zmienna | Opis | Przykładowa wartość | Wymagana |
|---------|------|---------------------|----------|
| `SECRET_KEY` | Django secret key (losowy, min. 50 znaków) | `django-insecure-...` | Tak |
| `DJANGO_DEBUG` | Tryb debug (`True`/`False`) | `False` | Tak |
| `OPENWEATHER_API_KEY` | Klucz API OpenWeather | `abc123...` | Tak |
| `GEMINI_API_KEY` | Klucz API Google Gemini | `AIzaSy...` | Tak |
| `DONATION_LIST_PATH` | Ścieżka do pliku donors.json | `donors.json` | Nie (default: `donors.json`) |
| `GODMODE_EMAIL` | Email administratora | `admin@example.com` | Nie (default: `test@pooltrackerdev.local`) |
| `BUYCOFFEE_URL` | URL do Buy Coffee | `https://buycoffee.to/...` | Nie (default ustawiony) |

---

## Kontrakt: Co serwis `db` eksponuje dla serwisu `web`

```
Serwis: db
  Hostname (Docker DNS): db
  Port: 5432
  Protokół: PostgreSQL wire protocol
  Gotowość: pg_isready zwraca 0
  Dane auth: przez POSTGRES_USER, POSTGRES_DB, POSTGRES_PASSWORD (z .env)
```

## Kontrakt: Co serwis `web` wymaga przed startem

```
Warunek: db.healthcheck == healthy
Sekwencja: migrate → collectstatic → gunicorn (w entrypoint.sh)
Oczekiwane env vars: DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, SECRET_KEY
```

---

## Szablon `.env`

Poniżej szablon do skopiowania jako `.env` (wypełnić wartościami przed uruchomieniem):

```env
# Database (PostgreSQL)
DB_NAME=pooltracker
DB_USER=pooltracker_user
DB_PASSWORD=ZMIEN_TO_NA_SILNE_HASLO
DB_HOST=db
DB_PORT=5432

# Django
SECRET_KEY=ZMIEN_TO_NA_LOSOWY_KLUCZ_MIN_50_ZNAKOW
DJANGO_DEBUG=False

# External APIs
OPENWEATHER_API_KEY=
GEMINI_API_KEY=

# Optional
DONATION_LIST_PATH=donors.json
GODMODE_EMAIL=admin@yourdomain.com
BUYCOFFEE_URL=https://buycoffee.to/basen.bialystok.pl
```
