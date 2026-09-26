# Quickstart: Przywrócenie brakujących funkcjonalności frontendu React

**Feature**: `004-restore-frontend-features`

---

## Wymagania wstępne

- Docker Desktop uruchomiony
- `OPENWEATHER_API_KEY` ustawiony w `.env` lub zmiennych środowiskowych
- Istniejące środowisko projektu działa (`docker compose up` bez błędów)

---

## Uruchomienie środowiska deweloperskiego

```bash
# Z katalogu głównego repozytorium
docker compose up --build
```

Po uruchomieniu:
- Frontend: http://localhost (Nginx → React SPA)
- Backend API: http://localhost/api/

---

## Weryfikacja nowego endpointu pogodowego

```bash
curl http://localhost/api/weather/
# Oczekiwany wynik: JSON z polami icon, description, temp, feels_like, humidity
```

---

## Weryfikacja poprawki timezone (statystyki historyczne)

1. Otwórz http://localhost w przeglądarce
2. Przejdź do sekcji „Statystyki historyczne"
3. Wybierz dowolny dzień tygodnia
4. Sprawdź, czy godziny na osi X odpowiadają rzeczywistym godzinom (np. szczyt ok. 17:00 w dni powszednie, nie 18:00)

---

## Weryfikacja trybu nocnego

1. Otwórz http://localhost
2. Kliknij przełącznik trybu nocnego w nagłówku
3. Sprawdź: tło, karty i tekst zmieniają się na ciemne
4. Przeładuj stronę — tryb nocny powinien być zachowany
5. Otwórz DevTools → Application → Local Storage → klucz `theme` = `"dark"`

---

## Weryfikacja okna modalnego z godzinami

1. Na dashboardzie kliknij ikonę dowolnej pływalni (okrągły element w karcie)
2. Okno modalne z harmonogramem godzin otwarcia powinno się pojawić
3. Sprawdź: Escape zamyka okno, przycisk „Zamknij" zamyka okno

---

## Testowanie

```bash
# Backend — testy jednostkowe
docker compose exec web python manage.py test chart_app

# Frontend — testy
docker compose exec frontend npm test
# lub lokalnie (jeśli node_modules zainstalowane):
cd frontend && npm test
```

---

## Pliki do modyfikacji (checklistka implementacji)

### Backend
- [ ] `tablechart/chart_app/views.py` — `get_weather_data()` (dodać cache), `api_weather_view()` (nowy), `update_chart()` i `stats_view()` (poprawka timezone)
- [ ] `tablechart/chart_app/urls.py` — dodać `path('api/weather/', views.api_weather_view)`

### Frontend
- [ ] `frontend/index.html` — dodać inline script anty-FOUC przed `<script type="module">`
- [ ] `frontend/src/index.css` — dodać CSS zmienne dark mode + style dla modalu
- [ ] `frontend/src/main.jsx` — owinąć aplikację w `ThemeProvider`
- [ ] `frontend/src/contexts/ThemeContext.jsx` — NOWY plik
- [ ] `frontend/src/components/DarkModeToggle.jsx` — NOWY plik
- [ ] `frontend/src/components/PoolModal.jsx` — NOWY plik
- [ ] `frontend/src/components/WeatherCard.jsx` — NOWY plik
- [ ] `frontend/src/components/FacebookCard.jsx` — NOWY plik
- [ ] `frontend/src/components/TodayChart.jsx` — NOWY plik
- [ ] `frontend/src/components/CurrentOccupancy.jsx` — dodać Google Maps adresy + klikalne ikony → PoolModal
- [ ] `frontend/src/pages/Dashboard.jsx` — dodać TodayChart, WeatherCard, FacebookCard, DarkModeToggle
- [ ] `frontend/src/services/api.js` — dodać `fetchWeather()`
