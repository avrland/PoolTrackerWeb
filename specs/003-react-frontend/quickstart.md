# Quickstart: Integracja React z PoolTracker

**Feature**: 003-react-frontend  
**Date**: 2026-05-05

---

## Wymagania wstępne

- Docker Desktop lub Docker Engine z Docker Compose v3.8+
- Node.js 20 LTS (tylko do lokalnego dev bez Docker)
- Plik `.env` w katalogu głównym repozytorium (istniejący — bez zmian)

---

## Struktura katalogów po implementacji

```
PoolTrackerWeb_avrland/
├── docker-compose.yml         # zaktualizowany (+ frontend service)
├── frontend/                  # NOWY
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
├── tablechart/                # Django — minimalne zmiany
│   ├── chart_app/
│   │   ├── views.py           # + api_current_view
│   │   └── urls.py            # + /api/current/
│   └── tablechart/
│       └── settings.py        # + corsheaders (dev)
└── .env                       # bez zmian
```

---

## Uruchomienie produkcji (Docker Compose)

```bash
# 1. Z katalogu głównego projektu — budowanie i uruchomienie wszystkich serwisów
docker compose up --build -d

# 2. Sprawdzenie stanu serwisów
docker compose ps

# 3. Aplikacja dostępna pod
http://localhost        # frontend React (nginx, port 80)
# Django dostępny wewnętrznie na web:8000 (NIE eksponowane zewnętrznie)

# 4. Logi frontendu
docker compose logs -f frontend

# 5. Zatrzymanie
docker compose down
```

---

## Środowisko developerskie (bez Docker)

### Backend Django

```bash
cd tablechart
pip install -r requirements.txt
python manage.py runserver 0.0.0.0:8000
# Django dostępny na http://localhost:8000
```

### Frontend React (Vite dev server)

```bash
cd frontend
npm install

# Utwórz plik konfiguracyjny dev (NIE commitować)
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local

npm run dev
# React dostępny na http://localhost:5173
# CORS musi być aktywny w Django (DJANGO_DEBUG=True w .env)
```

### Wymagania CORS dla dev

W pliku `.env` (lub lokalnie dla Django):
```
DJANGO_DEBUG=True
```

Django automatycznie aktywuje `corsheaders` gdy `DEBUG=True` i pozwala na requesty z `http://localhost:5173`.

---

## Build frontendu (bez Docker)

```bash
cd frontend
npm run build
# Output w frontend/dist/
```

---

## Testowanie

### Backend (pytest)

```bash
cd tablechart
python manage.py test chart_app.tests
# lub
cd src && pytest
```

### Frontend (Vitest)

```bash
cd frontend
npm test                    # tryb watch
npm run test:run            # jednorazowe uruchomienie (CI)
npm run test:coverage       # raport pokrycia (cel: 80%+)
```

---

## Zmienne środowiskowe (delta — tylko nowe)

| Zmienna | Gdzie | Wartość dev | Wartość prod |
|---------|-------|-------------|--------------|
| `VITE_API_BASE_URL` | `frontend/.env.local` | `http://localhost:8000` | *(nie ustawiać)* |
| `CORS_ALLOWED_ORIGINS` | `.env` (opcjonalne) | `http://localhost:5173` | *(nie ustawiać)* |

Wszystkie pozostałe zmienne bez zmian — patrz [specs/001-postgres-docker-setup/contracts/environment-variables.md](../../001-postgres-docker-setup/contracts/environment-variables.md).

---

## Weryfikacja działania po deploymencie

```bash
# 1. Sprawdź nowy endpoint Django API
curl http://localhost/api/current/
# Oczekiwany wynik: JSON z danymi basenów lub {"lastdate": "Brak danych..."}

# 2. Sprawdź istniejący endpoint historyczny
curl http://localhost/update_chart/stats0
# Oczekiwany wynik: JSON z danymi dla poniedziałku

# 3. Sprawdź SPA routing (React Router)
curl http://localhost/dashboard
# Oczekiwany wynik: HTML z <div id="root"> (index.html)

# 4. Sprawdź nginx gzip
curl -H "Accept-Encoding: gzip" -I http://localhost/assets/index.js
# Oczekiwany nagłówek: Content-Encoding: gzip
```

---

## Pułapki i rozwiązania

| Problem | Przyczyna | Rozwiązanie |
|---------|-----------|-------------|
| `CORS error` w przeglądarce (dev) | `DJANGO_DEBUG` nie jest `True` | Ustaw `DJANGO_DEBUG=True` w `.env` i uruchom ponownie Django |
| `502 Bad Gateway` po `/api/` | Serwis `web` nie uruchomiony lub niezdrowy | `docker compose logs web` — sprawdź błędy migracji |
| Strona React nie ładuje się po `docker compose up` | Frontend buduje się wolno (node_modules) | Poczekaj na `docker compose ps` i status `Up` dla `frontend` |
| Session expired przy `get_date_data` | Cookie nie przesyłane | Upewnij się, że `credentials: 'include'` w fetch i `SESSION_COOKIE_SAMESITE = 'Lax'` w Django settings |
