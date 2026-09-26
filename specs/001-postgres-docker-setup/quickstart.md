# Quickstart: PostgreSQL Docker Setup & Django Infrastructure Cleanup

**Feature**: 001-postgres-docker-setup  
**Data**: 2026-04-23

---

## Cel

Ten dokument opisuje jak uruchomić środowisko po wdrożeniu zmian z tej gałęzi oraz jak zweryfikować, że wszystko działa poprawnie.

---

## Wymagania wstępne

- Docker Desktop (lub Docker Engine + Docker Compose plugin) zainstalowany
- Plik `.env` wypełniony (patrz [contracts/environment-variables.md](contracts/environment-variables.md))

---

## Pierwsze uruchomienie (fresh start)

```bash
# 1. Wejdź do katalogu projektu
cd tablechart/

# 2. Skopiuj szablon .env i uzupełnij wartości
cp .env.example .env
# Edytuj .env i ustaw: DB_NAME, DB_USER, DB_PASSWORD, SECRET_KEY, API keys

# 3. Zbuduj i uruchom składa kontenerów
docker compose up --build
```

Oczekiwane logi startowe (w kolejności):
```
pooltracker-db    | database system is ready to accept connections
pooltracker-db    | (healthcheck: healthy)
pooltracker-web   | ==> Running Django migrations...
pooltracker-web   | Operations to perform: Apply all migrations: ...
pooltracker-web   | Running migrations: Applying chatbot_app... OK
pooltracker-web   | ==> Collecting static files...
pooltracker-web   | 150 static files copied to '/app/staticfiles'
pooltracker-web   | ==> Starting Gunicorn...
pooltracker-web   | [INFO] Booting worker with pid: ...
```

---

## Weryfikacja poprawności

### 1. Sprawdź status kontenerów
```bash
docker compose ps
```
Oczekiwane: oba kontenery `Up (healthy)` / `Up`.

### 2. Sprawdź aplikację w przeglądarce
Otwórz `http://localhost` — strona powinna załadować się z poprawnymi stylami CSS i JS (brak błędów 404 w DevTools → Network).

### 3. Sprawdź logi bazy danych
```bash
docker compose logs db --tail=20
```
Oczekiwane: brak błędów połączeń, wpisy akceptowania połączeń.

### 4. Sprawdź logi aplikacji
```bash
docker compose logs web --tail=30
```
Oczekiwane: linia `Starting Gunicorn`, brak traceback Django.

### 5. Test migracji (opcjonalnie)
```bash
docker compose exec web python manage.py showmigrations
```
Wszystkie migracje powinny być oznaczone `[X]`.

---

## Ponowne uruchomienie (dane zachowane)

```bash
# Zatrzymaj i uruchom ponownie (dane w bazie zachowane)
docker compose down
docker compose up
```

Dane bazy nie są usuwane — wolumin `postgres_data` jest trwały.

---

## Przebudowanie obrazu (po zmianach kodu)

```bash
docker compose up --build
```

---

## Usunięcie wszystkich danych (reset)

```bash
# UWAGA: usuwa wszystkie dane bazy!
docker compose down -v
docker compose up --build
```

---

## Tryb developerski (lokalnie, bez Dockera)

```bash
cd tablechart/

# Ustaw zmienne środowiskowe (DB_HOST powinien wskazywać na lokalny PostgreSQL)
# np. DB_HOST=localhost, DB_PORT=5432

# Uruchom migracje
python manage.py migrate

# Serwer deweloperski (serwuje assety z STATICFILES_DIRS, bez collectstatic)
python manage.py runserver
```

**Uwaga**: W trybie `DEBUG=True` pliki statyczne są serwowane automatycznie z katalogu `static/` przez Django — nie trzeba uruchamiać `collectstatic`.

---

## Troubleshooting

| Problem | Przyczyna | Rozwiązanie |
|---------|-----------|-------------|
| `web` pada z `OperationalError: could not connect to server` | `db` nie jest gotowy | Sprawdź healthcheck: `docker compose ps db` |
| `SystemCheckError: STATICFILES_DIRS contains STATIC_ROOT` | Stara konfiguracja settings.py | Upewnij się, że `STATIC_ROOT = BASE_DIR / 'staticfiles'` |
| Brak CSS/JS na stronie (błędy 404) | `collectstatic` nie był uruchomiony | Sprawdź logi: `docker compose logs web` — szukaj "Collecting static files" |
| `django.db.utils.OperationalError: FATAL: database does not exist` | `.env` nie ma poprawnej `DB_NAME` lub baza nie istnieje | Sprawdź `.env` i restart `db`: `docker compose restart db` |
| `ModuleNotFoundError: No module named 'psycopg2'` | `psycopg2-binary` nie w requirements.txt | Przebuduj obraz: `docker compose up --build` |
