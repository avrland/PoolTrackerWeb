# Environment Variables Contract: 003-react-frontend

**Feature**: 003-react-frontend  
**Date**: 2026-05-05

---

## Nowe zmienne środowiskowe — serwis `frontend`

Serwis `frontend` (Nginx) nie wymaga żadnych zmiennych środowiskowych w produkcji. Konfiguracja odbywa się przez `nginx.conf`.

### Vite (build-time — tylko dev)

| Zmienna | Przykład | Opis |
|---------|---------|------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Bazowy URL backendu Django w dev. W produkcji pusta (same-origin). |

Ustawiana w pliku `frontend/.env.local` (nie dodawać do repozytorium):

```
# frontend/.env.local (dev only — nie commitować)
VITE_API_BASE_URL=http://localhost:8000
```

W produkcji zmienna nie jest ustawiana — `api.js` używa ścieżek względnych (`/api/current/`).

---

## Zmiany w istniejących zmiennych — serwis `web` (Django)

Nowe opcjonalne zmienne dodawane do `.env`:

| Zmienna | Domyślna | Opis |
|---------|---------|------|
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Dozwolone originy CORS (aktywne tylko gdy `DJANGO_DEBUG=True`). Tylko do dev. |

---

## Brak zmian

Zmienne dla serwisów `db`, `scrapper`, `backup` pozostają bez zmian. Szczegółowy opis wszystkich istniejących zmiennych w [specs/001-postgres-docker-setup/contracts/environment-variables.md](../../001-postgres-docker-setup/contracts/environment-variables.md).

---

## Docker Compose — serwis `frontend` (nowy)

```yaml
frontend:
  build: ./frontend
  container_name: pooltracker-frontend
  depends_on:
    web:
      condition: service_started
  ports:
    - "80:80"
  restart: unless-stopped
  # Brak env_file — nginx nie wymaga zmiennych środowiskowych
```

Serwis `web` traci ekspozycję portu `8000` na zewnątrz (dostępny tylko wewnętrznie dla nginx):

```yaml
web:
  # USUNĄĆ: ports: - "8000:8000"
  # (opcjonalnie zachować w docker-compose.dev.yml override)
```
