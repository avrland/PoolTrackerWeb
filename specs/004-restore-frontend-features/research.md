# Research: Przywrócenie brakujących funkcjonalności frontendu React

**Feature**: `004-restore-frontend-features`  
**Date**: 2026-05-05  
**Status**: Complete — wszystkie NEEDS CLARIFICATION rozwiązane

---

## 1. Przyczyna przesunięcia godzin +1h (statystyki historyczne)

### Decision
Poprawka w **backendzie** Django: odjąć 1h od surowych wartości z kolumny `time` przy formatowaniu w `update_chart` i `stats_view`.

### Rationale
Kolumna `time` w tabeli `poolstats_history` ma typ PostgreSQL `TIME` (bez strefy czasowej). Psycopg2 zwraca ją jako naiwny obiekt `datetime.time`. Błąd pochodzi ze scrappera — w `push_to_db()` ręcznie dodawany jest offset bazowany na `time.localtime().tm_isdst` systemu (który w kontenerze Docker z UTC zawsze = 0), co powoduje dodanie +1h do każdego zapisu. W efekcie zmagazynowane czasy są o 1h do przodu względem rzeczywistego czasu warszawskiego (CET, UTC+1; w lecie CEST = UTC+2 ale tu przesunięcie staje się widoczne).

### Fix
**Krótkoterminowy (Django view)** — odjąć `timedelta(hours=1)` przy formatowaniu:
```python
from datetime import timedelta, datetime as dt_obj

time_sunday_formatted = [
    (dt_obj.combine(dt_obj.today(), t) - timedelta(hours=1)).strftime("%H:%M")
    for t in time_sunday
]
```

**Długoterminowy (scrapper)** — usunąć ręczne przesunięcia z `scrapper.py`, użyć `datetime.now(pytz.timezone('Europe/Warsaw'))`.

### Alternatives Considered
- Poprawka po stronie frontendu JavaScript — odrzucona: wymaga wiedzy o offsetcie na kliencie, jest duplikacją logiki, nie naprawia danych historycznych.
- Migracja danych w bazie (odejmowanie 1h ze wszystkich rekordów) — odrzucona: ryzykowna operacja na danych produkcyjnych, nie objęta tym feature'em.

---

## 2. Tryb nocny (Dark Mode) w React 18

### Decision
**CSS custom properties na `<html data-theme>` + React Context + localStorage + wczesny inline script** w `index.html` zapobiegający FOUC (flash of unstyled content).

### Rationale
- CSS zmienne na `<html>` są dostępne w całym drzewie DOM, w tym przed hydracją React.
- Wczesny skrypt synchroniczny w `<head>` odczytuje localStorage i ustawia `data-theme` przed renderowaniem, eliminując migotanie.
- React Context + `useTheme()` hook zapewnia reaktywne aktualizacje bez prop-drillingu.
- `prefers-color-scheme` jako fallback dla pierwszej wizyty (brak wartości w localStorage).

### Pattern
```html
<!-- frontend/index.html — w <head> przed <script type="module"> -->
<script>
  (function() {
    var saved = localStorage.getItem('theme');
    var isDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  })();
</script>
```

```css
/* index.css */
:root {
  --color-bg: #f4f6f9;
  --color-text: #333;
  --color-card-bg: #fff;
  --color-border: #e9ecef;
  --color-muted: #6c757d;
}
html[data-theme='dark'] {
  --color-bg: #1a1a1a;
  --color-text: #e0e0e0;
  --color-card-bg: #2d2d2d;
  --color-border: #3a3a3a;
  --color-muted: #9ca3af;
}
body { background-color: var(--color-bg); color: var(--color-text); transition: background-color 0.2s, color 0.2s; }
```

### Alternatives Considered
- Tailwind `dark:` classes — odrzucone: projekt nie używa Tailwind.
- CSS Media Query only (`@media (prefers-color-scheme: dark)`) — odrzucone: nie pozwala na ręczne przełączanie przez użytkownika.

---

## 3. Okno modalne z godzinami otwarcia pływalni

### Decision
**Natywny element HTML `<dialog>`** z kontrolowanym stanem React (ref + `showModal()`/`close()`).

### Rationale
- `<dialog>` jest WCAG 2.1 AA compliant out-of-the-box: pułapka fokusa (focus trap), obsługa Escape, blokowanie tła dla AT.
- Mniej kodu niż niestandardowa nakładka `div` (brak ręcznego zarządzania fokusem i nasłuchiwacza Escape).
- `::backdrop` pseudoelement dla przyciemnienia tła bez dodatkowego HTML.

### Pattern
```jsx
function PoolInfoModal({ isOpen, onClose, title, hours, address, mapsUrl }) {
  const dialogRef = useRef(null)
  useEffect(() => {
    if (isOpen) dialogRef.current?.showModal()
    else if (dialogRef.current?.open) dialogRef.current?.close()
  }, [isOpen])
  return (
    <dialog ref={dialogRef} className="pool-modal" onClose={onClose}
            onClick={e => e.target === dialogRef.current && onClose()}>
      <div className="pool-modal__content">
        <button onClick={onClose} aria-label="Zamknij">✕</button>
        <h2>{title}</h2>
        <table>...</table>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer">{address}</a>
      </div>
    </dialog>
  )
}
```

### Alternatives Considered
- Biblioteka headlessui/radix — odrzucona: nadmierna zależność dla jednego okna modalnego.
- Niestandardowy `div` z `position:fixed` — odrzucony: wymaga ręcznego focus trap + Escape listener, gorsze semantyki dla AT.

---

## 4. Wykres obłożenia bieżącego dnia — źródło danych

### Decision
**Reużycie danych z cache TanStack Query** pod kluczem `['current']` — bez nowego endpointu.

### Rationale
`/api/current/` już zwraca tablice `date`, `sport`, `family`, `small`, `ice` zawierające dane z dzisiejszego dnia od godziny 6:00. Komponent `CurrentOccupancy` już pobiera te dane. Komponent `TodayChart` może użyć tego samego `queryKey: ['current']` — TanStack Query zwróci dane z cache bez kolejnego zapytania sieciowego.

### Pattern
```jsx
// TodayChart.jsx — reużywa cache z CurrentOccupancy
const { data, isLoading } = useQuery({
  queryKey: ['current'],  // Ten sam klucz — brak duplikatu żądania
  queryFn: fetchCurrentData,
  staleTime: 5 * 60 * 1000,
})
// data.date, data.sport, data.family, data.small, data.ice
```

### Alternatives Considered
- Nowy endpoint `/api/today/` — odrzucony: niepotrzebna duplikacja danych już dostępnych przez `/api/current/`.
- Props drilling z `CurrentOccupancy` do `TodayChart` — odrzucony: komplikuje strukturę komponentów, łamie separację odpowiedzialności.

---

## 5. Karta pogody — caching i architektura

### Decision
**Nowy endpoint Django `/api/weather/`** (GET, bez auth) z 10-minutowym cache po stronie serwera i nagłówkiem `Cache-Control: public, max-age=600`.

### Rationale
- Klucz API OpenWeatherMap jest tylko po stronie serwera — nie może być ujawniony w kodzie frontend (bezpieczeństwo).
- OpenWeatherMap nie obsługuje CORS dla żądań bezpośrednio z przeglądarki.
- Backend już posiada `get_weather_data()` i `cache` — wystarczy dodać endpoint.
- 10 minut cache = max 6 żądań/godzinę (plan darmowy: 60/min), dużo poniżej limitu.

### Response schema (JSON)
```json
{
  "icon": "02d",
  "description": "Pochmurnie",
  "temp": 22,
  "feels_like": 20,
  "humidity": 65
}
```
Błąd (503 gdy API niedostępne):
```json
{ "error": "Usługa pogodowa niedostępna" }
```

### Fix dla istniejącej funkcji `get_weather_data()`
Dodać caching — istniejąca funkcja wywołuje API przy każdym żądaniu strony HTML. Po refaktorze używa `cache.get/set` z TTL 600s.

### Alternatives Considered
- Pobieranie pogody bezpośrednio przez frontend — odrzucone: bezpieczeństwo klucza API, CORS.
- Cache Redis — odrzucony: nadmiarowy dla pojedynczego projektu. LocMemCache jest wystarczający dla jednego kontenera.
- Dłuższy TTL (1h) — odrzucony: dane pogodowe mogą się zmieniać dość często, 10 min to rozsądny kompromis.

---

## 6. Google Maps i adresy pływalni

### Decision
**Zakodowane na stałe** adresy i linki Google Maps w konfiguracji komponentów (nie pobierane z bazy danych).

### Rationale
Dane te są statyczne (adresy fizyczne pływalni rzadko się zmieniają) i były zakodowane na stałe w poprzedniej wersji Django. Brak potrzeby osobnego endpointu API ani modelu bazy danych.

### Dane obiektów

| Klucz | Nazwa | Adres | Link Google Maps |
|-------|-------|-------|-----------------|
| `small` | Basen Kameralny | Mazowiecka 39C, 15-302 Białystok | https://maps.app.goo.gl/YTTwYV16m3tyxoW76 |
| `sport` | Basen Sportowy | Włókiennicza 4, 15-465 Białystok | https://maps.app.goo.gl/KXXXf2iYu16VJgCz5 |
| `family` | Basen Rodzinny | Stroma 1A, 15-661 Białystok | https://maps.app.goo.gl/gpSoMPBoRtcT9dw89 |
| `ice` | Lodowisko | 11 Listopada 28, 15-320 Białystok | https://maps.app.goo.gl/WTfr4wwKsGnKtJUQ9 |

---

## 7. Karta Facebook

### Decision
**Statyczny komponent React** z hardcoded linkiem do `facebook.com/basenbialystok`.

### Rationale
Identyczne jak w poprzedniej wersji Django — statyczna karta informacyjna bez dynamicznych danych. Brak potrzeby API ani bazy danych.

---

## Podsumowanie decyzji

| Zagadnienie | Decyzja | Lokalizacja zmian |
|-------------|---------|------------------|
| Timezone fix +1h | Backend: odejmij `timedelta(hours=1)` przy formatowaniu czasów historycznych | `chart_app/views.py` |
| Tryb nocny | CSS vars + `<html data-theme>` + Context + localStorage + inline script FOUC | `index.html`, `index.css`, nowy `ThemeContext.jsx`, nowy `DarkModeToggle.jsx` |
| Okno modalne | Natywny `<dialog>` + React ref | Nowy `PoolModal.jsx`, modyfikacja `CurrentOccupancy.jsx` |
| Wykres dnia | Reużycie TanStack cache `['current']` | Nowy `TodayChart.jsx`, modyfikacja `Dashboard.jsx` |
| Pogoda | Nowy Django endpoint `/api/weather/` z 10-min cache | `chart_app/views.py`, `chart_app/urls.py`, nowy `WeatherCard.jsx`, modyfikacja `api.js` |
| Adresy / Google Maps | Hardcoded w konfiguracji komponentu | Modyfikacja `CurrentOccupancy.jsx` |
| Facebook | Statyczny komponent | Nowy `FacebookCard.jsx`, modyfikacja `Dashboard.jsx` |
