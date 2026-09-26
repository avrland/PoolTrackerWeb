# Quickstart: Uruchomienie zintegrowanego systemu PoolTracker

**Phase 1 Output** | Branch: `002-scrapper-docker-integration` | Date: 2026-04-27

---

## Wymagania wstępne

- Docker Engine ≥ 24.0 oraz Docker Compose v2 (polecenie `docker compose`)
- Git
- Dostęp do internetu (pobieranie obrazów Docker, scrapper odpytuje zewnętrzne API)

---

## 1. Sklonuj repozytorium

```bash
git clone <URL-repozytorium>
cd PoolTrackerWeb_avrland
```

---

## 2. Skonfiguruj zmienne środowiskowe

Skopiuj plik przykładowy i uzupełnij wartości:

```bash
cp .env.example .env
```

Otwórz `.env` i ustaw:
- `DB_PASSWORD` — dowolne bezpieczne hasło
- `DJANGO_SECRET_KEY` — losowy ciąg 50 znaków (np. `python -c "import secrets; print(secrets.token_urlsafe(50))"`)
- `DB_NAME`, `DB_USER` — możesz zostawić domyślne wartości z przykładu

**Ważne**: Nigdy nie commituj pliku `.env` z prawdziwymi danymi do repozytorium.

---

## 3. Uruchom wszystkie usługi

```bash
docker compose up -d
```

Docker Compose uruchomi trzy usługi w odpowiedniej kolejności:
1. **`db`** — PostgreSQL 16 (inicjalizuje schemat bazy przy pierwszym uruchomieniu)
2. **`web`** — Aplikacja Django (czeka na gotowość bazy)
3. **`scrapper`** — Scrapper danych (czeka na gotowość bazy)

---

## 4. Sprawdź czy wszystkie usługi działają

```bash
docker compose ps
```

Oczekiwany wynik — wszystkie cztery usługi w statusie `running` (lub `healthy`):

```
NAME                  STATUS
pooltracker-db        running (healthy)
pooltracker-web       running
pooltracker-scrapper  running
pooltracker-backup    running
```

---

## 5. Sprawdź logi

**Logi scrapera** (sprawdź czy harmonogram się uruchomił):
```bash
docker compose logs scrapper
```
Oczekiwany komunikat: `Scheduler started.`

**Logi aplikacji webowej**:
```bash
docker compose logs web
```

**Logi wszystkich usług na żywo**:
```bash
docker compose logs -f
```

---

## 6. Otwórz aplikację webową

Aplikacja jest dostępna pod adresem: [http://localhost:8000](http://localhost:8000)

---

## 7. Weryfikacja zbierania danych

Po 15 minutach od uruchomienia możesz sprawdzić czy scrapper zapisał dane do bazy:

```bash
docker compose exec db psql -U $DB_USER -d $DB_NAME -c 'SELECT * FROM "poolStats" ORDER BY date DESC LIMIT 5;'
```

Oczekiwany wynik: kilka rekordów z aktualną datą i wartościami obłożenia.

---

## 8. Weryfikacja backupu

Backup wykonywany jest automatycznie zgodnie z harmonogramem (`@weekly`). Aby wywołać backup ręcznie w celu weryfikacji:

```bash
docker compose exec backup /bin/sh -c "/backup.sh"
```

Sprawdź pliki backupu w folderze na hoście:

```bash
ls -lh ./backups/
```

Oczekiwany wynik: plik w formacie `pooltracker_YYYY-MM-DDTHH-MM-SS.sql.gz`.

**Testowe przywracanie backupu** (opcjonalne, na środowisku testowym):

```bash
# Przywracanie z pliku backupu
gunzip -c ./backups/pooltracker_YYYY-MM-DDTHH-MM-SS.sql.gz | \
  docker compose exec -T db psql -U $DB_USER -d $DB_NAME
```

---

## Zatrzymanie systemu

```bash
# Zatrzymaj kontenery (zachowaj dane bazy)
docker compose down

# Zatrzymaj i usuń wolumeny z danymi bazy (UWAGA: kasuje dane!)
docker compose down -v
```

---

## Rozwiązywanie problemów

| Problem | Możliwa przyczyna | Rozwiązanie |
|---------|------------------|-------------|
| `web` lub `scrapper` nie startuje | Baza nie jest jeszcze gotowa | Zaczekaj — usługi automatycznie czekają na healthcheck `db` |
| `Error: password authentication failed` | Zły `DB_PASSWORD` w `.env` | Ustaw poprawne hasło i uruchom `docker compose down -v && docker compose up -d` |
| Brak danych w bazie po 15 min | Scrapper nie może połączyć się z zewnętrznym API | Sprawdź `docker compose logs scrapper` — błąd połączenia z `miejskoaktywni.pl` |
| `Port 8000 already in use` | Inny proces używa portu 8000 | Zmień port w `docker-compose.yml`: `"8080:8000"` |
| Znaczniki czasu w bazie są w UTC | `TZ` env var nie dotarła do kontenera | Sprawdź czy serwis `scrapper` ma `TZ=Europe/Warsaw` w `docker-compose.yml` |
| Folder `backups/` jest pusty po tygodniu | Serwis `backup` nie działa lub brak uprawnień | Sprawdź `docker compose logs backup`; sprawdź uprawnienia do folderu `./backups` na hoście |
| Backup kończy się błędem połączenia | Serwis `backup` startuje przed bazą | Dodaj `depends_on: db: condition: service_healthy` do serwisu `backup` w `docker-compose.yml` |
