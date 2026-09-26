# Data Model: PostgreSQL Docker Setup & Django Infrastructure Cleanup

**Phase**: 1 (Design)  
**Date**: 2026-04-23  
**Feature**: [plan.md](plan.md) | [research.md](research.md)

---

## Uwaga o zakresie

Ta zmiana jest **infrastrukturalna** — nie wprowadza nowych encji danych ani zmian w schemacie bazy. Żadne modele Django (`models.py`) nie są modyfikowane. Poniższy dokument opisuje konfigurację techniczną systemu jako "model danych konfiguracyjnych".

---

## Encje systemowe

### 1. Serwis PostgreSQL (kontener Docker)

**Odpowiedzialność**: Przechowywanie trwałych danych aplikacji.

| Atrybut konfiguracyjny | Wartość / Źródło | Wymagany |
|------------------------|-----------------|----------|
| `POSTGRES_DB` | `${DB_NAME}` z `.env` | Tak |
| `POSTGRES_USER` | `${DB_USER}` z `.env` | Tak |
| `POSTGRES_PASSWORD` | `${DB_PASSWORD}` z `.env` | Tak |
| Port | `5432` (wewnętrzny, nieeksponowany na zewnątrz) | Tak |
| Wolumin danych | `postgres_data:/var/lib/postgresql/data` | Tak |

**Lifecycle**: Trwały — dane przeżywają `docker compose down` (wolumin nazwany). Usunięcie danych wymaga `docker compose down -v`.

**Health check**:
- Komenda: `pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}`
- Częstotliwość: co 10 sekund
- Timeout: 5 sekund
- Retries: 5
- Start period: 10 sekund (czas inicjalizacji bazy)
- Status `healthy` wymagany zanim serwis `web` się uruchomi

---

### 2. Serwis Web (kontener Django + Gunicorn)

**Odpowiedzialność**: Obsługa żądań HTTP, wykonanie migracji i zbierania assetów przy starcie.

| Atrybut konfiguracyjny | Wartość / Źródło | Wymagany |
|------------------------|-----------------|----------|
| `DB_NAME` | z `.env` | Tak |
| `DB_USER` | z `.env` | Tak |
| `DB_PASSWORD` | z `.env` | Tak |
| `DB_HOST` | `db` (nazwa serwisu Docker) lub z `.env` | Tak |
| `DB_PORT` | `5432` lub z `.env` | Tak |
| `SECRET_KEY` | z `.env` | Tak |
| `DJANGO_DEBUG` | `False` (produkcja) | Tak |
| `GEMINI_API_KEY` | z `.env` | Tak |
| `OPENWEATHER_API_KEY` | z `.env` | Tak |
| Port | `80:8000` (host:kontener) | Tak |

**Zależność**: `db: condition: service_healthy` — serwis web NIE startuje przed `db: healthy`.

**Sekwencja startowa** (wykonuje `entrypoint.sh`):
1. `python manage.py migrate --noinput`
2. `python manage.py collectstatic --noinput --clear`
3. `exec gunicorn tablechart.wsgi:application --bind 0.0.0.0:8000 ...`

---

### 3. Wolumin danych bazy (`postgres_data`)

**Odpowiedzialność**: Trwałe przechowywanie plików PostgreSQL poza cyklem życia kontenerów.

| Właściwość | Wartość |
|------------|---------|
| Nazwa | `postgres_data` |
| Typ | Named Docker volume |
| Montowany w | `/var/lib/postgresql/data` (kontener `db`) |
| Persistence | Przeżywa `docker compose down`; NIE przeżywa `docker compose down -v` |
| Backup | Poza zakresem tej zmiany |

---

### 4. Katalog plików statycznych (`staticfiles/`)

**Odpowiedzialność**: Wyjściowy katalog dla `collectstatic` — serwowany przez WhiteNoise.

| Właściwość | Wartość |
|------------|---------|
| Ścieżka | `tablechart/staticfiles/` |
| Konfiguracja Django | `STATIC_ROOT = BASE_DIR / 'staticfiles'` |
| Generowany przez | `python manage.py collectstatic` |
| Wersjonowany | Nie (w `.gitignore`) |
| Serwowany przez | WhiteNoise middleware |
| Storage backend | `whitenoise.storage.CompressedManifestStaticFilesStorage` |

---

### 5. Katalog źródłowych plików statycznych (`static/`)

**Odpowiedzialność**: Źródłowe assety projektu (CSS, JS, obrazki) przekazywane do `collectstatic`.

| Właściwość | Wartość |
|------------|---------|
| Ścieżka | `tablechart/static/` (istniejący katalog) |
| Konfiguracja Django | `STATICFILES_DIRS = [BASE_DIR / 'static']` |
| Wersjonowany | Tak |
| Zapis | Tylko developerzy (nie generowany przez aplikację) |

---

## Relacje między encjami

```
┌─────────────────────┐          ┌──────────────────────┐
│   Kontener: web     │          │   Kontener: db        │
│   (Django+Gunicorn) │          │   (PostgreSQL 16)     │
│                     │          │                       │
│  depends_on: db     │──────────▶  healthcheck: ok      │
│  (service_healthy)  │          │  pg_isready           │
│                     │          │                       │
│  DB_HOST=db         │──────────▶  Port 5432            │
│  (Docker DNS)       │          │                       │
└────────┬────────────┘          └──────────┬────────────┘
         │                                  │
         │ mounts                           │ mounts
         ▼                                  ▼
   staticfiles/                      postgres_data
   (STATIC_ROOT)                     (named volume)
```

---

## Migracje

Istniejące migracje (w `chatbot_app/migrations/`) zostały napisane dla MySQL. PostgreSQL jest kompatybilny z tymi migracjami — Django ORM generuje SQL specyficzny dla silnika bazy danych. Migracja na PostgreSQL **nie wymaga** ręcznej modyfikacji plików migracji.

**Uwaga**: Dane z poprzedniej bazy MySQL NIE są migrowane automatycznie — zakładamy świeżą bazę PostgreSQL.
