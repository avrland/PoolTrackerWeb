# Contract: Zmienne środowiskowe

**Phase 1 Output** | Branch: `002-scrapper-docker-integration` | Date: 2026-04-27

---

## Opis

Wszystkie usługi (baza danych, aplikacja webowa Django, scrapper) konfigurowane są przez wspólny plik `.env` w katalogu głównym projektu. Plik `.env` jest ładowany przez Docker Compose i przekazywany do odpowiednich serwisów.

---

## Plik `.env` — wymagane zmienne

Szablon: `.env.example` (powinien być commitowany do repozytorium)  
Właściwy plik: `.env` (NIGDY nie commitować — dodać do `.gitignore`)

### Zmienne bazy danych (wspólne dla `db`, `web`, `scrapper`)

| Zmienna | Opis | Przykładowa wartość | Wymagane przez |
|---------|------|---------------------|---------------|
| `DB_NAME` | Nazwa bazy danych PostgreSQL | `pooltracker` | `db`, `web`, `scrapper` |
| `DB_USER` | Użytkownik bazy danych | `pooltracker_user` | `db`, `web`, `scrapper` |
| `DB_PASSWORD` | Hasło użytkownika bazy danych | `your-secret-password` | `db`, `web`, `scrapper` |
| `DB_HOST` | Adres hosta bazy (w Docker Compose: nazwa serwisu) | `db` | `web`, `scrapper` |

### Zmienne aplikacji Django

| Zmienna | Opis | Przykładowa wartość | Wymagane przez |
|---------|------|---------------------|---------------|
| `DJANGO_SECRET_KEY` | Sekretny klucz Django | `your-50-char-random-string` | `web` |
| `DEBUG` | Tryb debugowania (wyłączyć na produkcji) | `False` | `web` |

### Zmienne scrapera (opcjonalne)

| Zmienna | Opis | Przykładowa wartość | Wymagane przez |
|---------|------|---------------------|---------------|
| `TZ` | Strefa czasowa (ważna dla poprawnych znaczników czasu) | `Europe/Warsaw` | `scrapper` |

### Zmienne backupu bazy danych

| Zmienna | Opis | Przykładowa wartość | Wymagane przez |
|---------|------|---------------------|---------------|
| `BACKUP_KEEP_DAYS` | Liczba dni przechowywania dzienną backupów | `30` | `backup` |
| `BACKUP_KEEP_WEEKS` | Liczba tygodniowych backupów do zachowania | `4` | `backup` |
| `SCHEDULE` | Harmonogram cron backupu | `@weekly` | `backup` |

> **Uwaga**: Lokalizacja folderu backupu na hoście konfigurowana jest jako bind mount w `docker-compose.yml` (sekcja `volumes` serwisu `backup`), nie przez zmienną środowiskową.

---

## Przykładowy plik `.env.example`

```dotenv
# === Baza danych PostgreSQL ===
DB_NAME=pooltracker
DB_USER=pooltracker_user
DB_PASSWORD=change-me-in-production
DB_HOST=db

# === Django ===
DJANGO_SECRET_KEY=change-me-to-50-random-chars
DEBUG=False

# === Scrapper ===
# TZ jest ustawiane bezpośrednio w docker-compose.yml jako hardcoded Europe/Warsaw
# Można nadpisać tutaj jeśli potrzebna inna strefa
# TZ=Europe/Warsaw

# === Backup bazy danych ===
# Harmonogram cron (domyślnie: raz w tygodniu)
SCHEDULE=@weekly
# Retencja codziennych backupów w dniach
BACKUP_KEEP_DAYS=30
# Liczba tygodniowych backupów do zachowania
BACKUP_KEEP_WEEKS=4
```

---

## Mapowanie zmiennych do serwisów w Docker Compose

```yaml
# Serwis db — używa zmiennych przez POSTGRES_* (PostgreSQL image convention)
environment:
  POSTGRES_DB: ${DB_NAME}
  POSTGRES_USER: ${DB_USER}
  POSTGRES_PASSWORD: ${DB_PASSWORD}

# Serwis web — wczytuje plik .env całościowo
env_file:
  - .env

# Serwis scrapper — wczytuje plik .env + dodaje TZ
env_file:
  - .env
environment:
  - TZ=Europe/Warsaw

# Serwis backup — wczytuje .env (DB creds) + zmienne retencji + ścieżkę jako bind mount
env_file:
  - .env
environment:
  POSTGRES_HOST: db
  POSTGRES_DB: ${DB_NAME}
  POSTGRES_USER: ${DB_USER}
  POSTGRES_PASSWORD: ${DB_PASSWORD}
  SCHEDULE: ${SCHEDULE:-@weekly}
  BACKUP_KEEP_DAYS: ${BACKUP_KEEP_DAYS:-30}
  BACKUP_KEEP_WEEKS: ${BACKUP_KEEP_WEEKS:-4}
volumes:
  - ./backups:/backups
```

---

## Uwagi bezpieczeństwa

- Plik `.env` musi być wymieniony w `.gitignore`; domyślnie jest tam już `*.env` — zweryfikuj że dotyczy też `.env`.
- `DB_PASSWORD` nigdy nie powinno być commitowane; w CI/CD użyj secrets managera (GitHub Secrets, Vault, etc.).
- Na produkcji rozważ `chmod 600 .env` aby ograniczyć dostęp do pliku.
- Zmienna `DEBUG` MUSI być `False` na produkcji (ujawnia wewnętrzne błędy Django).
