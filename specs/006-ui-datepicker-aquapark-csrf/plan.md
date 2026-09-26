# Implementation Plan: Wykres dnia z datepickerem, poprawka kafelka Aquapark i naprawa CSRF chatbota

**Branch**: `006-ui-datepicker-aquapark-csrf` | **Date**: 2026-05-06 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/006-ui-datepicker-aquapark-csrf/spec.md`

---

## Summary

Trzy niezależne poprawki UI/UX na istniejącej aplikacji React + Django:

1. **Wykres dnia** (`TodayChart.jsx`) — dodanie datepickera z przyciskiem „Dzisiaj", poprawka legendy osi X (godziny HH:MM zamiast liczb porządkowych w tooltipie).
2. **Kafelek Aquapark** (`CountdownCard.jsx`) — pełny wording „Aquapark Andersa | Grudzień 2028", symbol 🏗️, licznik dni + HH:MM:SS z linkiem do artykułu Lech.
3. **CSRF chatbota** (`chart_app/views.py`) — dodanie `@ensure_csrf_cookie` na `api_current_view`, aby ciasteczko `csrftoken` było ustawiane przy pierwszym żądaniu GET.

---

## Technical Context

**Language/Version**: Python 3.11 (backend Django 4.x + Gunicorn), JavaScript ES2022 (frontend React 18, Vite 5)  
**Primary Dependencies**: React 18, TanStack Query 5, react-apexcharts 1.4.0, ApexCharts 3.54.0, Django 4.x, django-ratelimit, bleach  
**Storage**: PostgreSQL 16 — tabela `poolStats` (bieżące dane), `poolstats_history` (dane historyczne)  
**Testing**: Vitest + React Testing Library (frontend), Django test framework (backend)  
**Target Platform**: Docker Compose (dev + prod), Nginx 1.25-alpine (reverse proxy + React static files)  
**Project Type**: Web application (backend + frontend)  
**Performance Goals**: Dashboard page load < 2s (p95), API response < 500ms (p95), licznik odświeżany co 1s bez wpływu na wydajność  
**Constraints**: Brak nowych zewnętrznych zależności npm; datepicker natywny HTML5; brak zmian w schemacie bazy danych  
**Scale/Scope**: ~1000 dziennych użytkowników; 4 pliki do modyfikacji

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality First | ✅ PASS | Zmiany w istniejących plikach; magic strings (TARGET_DATE, AQUAPARK_URL) wyodrębnione do nazwanych stałych |
| II. Test-Driven Development | ✅ PASS | Testy frontendowe aktualizowane przed/równolegle z implementacją; backend test dla @ensure_csrf_cookie |
| III. User Experience Consistency | ✅ PASS | Mobile-first; stany loading/error; accessibility zachowana; Polish UX |
| IV. Performance & Scalability | ✅ PASS | Cache TanStack Query współdzielona dla trybu "Dzisiaj" (0 extra requests); setInterval tylko dla CountdownCard |

**Re-check post-design**: Brak naruszeń. Zmiany minimalne i chirurgiczne — wyłącznie w wymaganych plikach.

---

## Project Structure

### Documentation (this feature)

```text
specs/006-ui-datepicker-aquapark-csrf/
├── spec.md              ✅ Gotowe
├── research.md          ✅ Gotowe (Phase 0)
├── data-model.md        ✅ Gotowe (Phase 1)
├── quickstart.md        ✅ Gotowe (Phase 1)
├── contracts/
│   └── api-contracts.md ✅ Gotowe (Phase 1)
└── tasks.md             ← Tworzone przez /speckit.tasks
```

### Source Code (modified files only)

```text
# Backend — Django
tablechart/chart_app/views.py
  └── api_current_view() — dodanie @ensure_csrf_cookie

# Frontend — React
frontend/src/components/TodayChart.jsx     ← przepisanie: datepicker, fix tooltip, sessionId prop
frontend/src/components/CountdownCard.jsx  ← przepisanie: pełny wording, setInterval, linki
frontend/src/pages/Dashboard.jsx           ← dodanie sessionId prop do <TodayChart>

# Testy frontendowe (aktualizacja istniejących)
frontend/src/tests/TodayChart.test.jsx     ← aktualizacja props + nowe assertions
frontend/src/tests/CountdownCard.test.jsx  ← nowe assertions dla tytułu, linku, licznika
```

---

## Complexity Tracking

Brak naruszeń konstytucji — sekcja nie wymagana.

---

## Implementation Design

### Zmiana 1 — Backend CSRF fix (1 linia)

```python
# tablechart/chart_app/views.py
from django.views.decorators.csrf import ensure_csrf_cookie  # dodać do importów

@ensure_csrf_cookie   # ← dodać nad istniejącymi dekoratorami
@require_GET
@ratelimit(key='ip', rate='60/m', method='GET', block=True)
def api_current_view(request):
    ...
```

Kolejność dekoratorów: `@ensure_csrf_cookie` na górze (zewnętrzny), ponieważ musi opakować cały widok, włącznie z rate-limitingiem.

---

### Zmiana 2 — TodayChart.jsx (refactor)

**Stan**:
```js
const todayStr = new Date().toISOString().slice(0, 10)  // "YYYY-MM-DD"
const [selectedDate, setSelectedDate] = useState(todayStr)
const isToday = selectedDate === todayStr
```

**React Query**:
```js
// Tryb "Dzisiaj" — współdzielona cache z CurrentOccupancy
const todayQuery = useQuery({
  queryKey: ['current'],
  queryFn: fetchCurrentData,
  refetchInterval: 5 * 60 * 1000,
  enabled: isToday,
})

// Tryb historyczny
const dateQuery = useQuery({
  queryKey: ['date', selectedDate],
  queryFn: () => fetchDateData(selectedDate, sessionId),
  enabled: !isToday && !!sessionId,
  staleTime: Infinity,  // dane historyczne się nie zmieniają
})
```

**Tooltip fix**:
```js
const CHART_OPTIONS = (categories) => ({
  ...
  tooltip: {
    x: { formatter: (val, opts) => categories[opts.dataPointIndex] ?? val },
    y: { formatter: (val) => `${val} os.` },
  },
})
```

**Tytuł**:
```js
const chartTitle = isToday
  ? 'Dzisiaj'
  : new Intl.DateTimeFormat('pl-PL', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(selectedDate + 'T12:00:00'))  // T12 zapobiega przesuniętej strefie czasowej
```

**Datepicker UI**:
```jsx
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <h3>{chartTitle}</h3>
  <div>
    {!isToday && (
      <button onClick={() => setSelectedDate(todayStr)}>Dzisiaj</button>
    )}
    <input
      type="date"
      value={selectedDate}
      max={todayStr}
      disabled={!sessionId}
      onChange={(e) => setSelectedDate(e.target.value)}
    />
  </div>
</div>
```

---

### Zmiana 3 — CountdownCard.jsx (refactor)

```jsx
const AQUAPARK_URL = 'https://www.lech.net.pl/pl/aktualnosci/bedziemy-budowac-aquapark-w-bialymstoku-.html'
const TARGET = new Date('2028-12-15T00:00:00')

export default function CountdownCard() {
  const [countdown, setCountdown] = useState(null)

  useEffect(() => {
    function tick() {
      const now = new Date()
      const distance = TARGET - now
      if (distance <= 0) {
        setCountdown(null)  // isOpen
        return
      }
      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)
      setCountdown({ days, hours, minutes, seconds })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // JSX: tytuł "Aquapark Andersa | Grudzień 2028", 🏗️,
  //       link na days i na HH:MM:SS, fallback "Aquapark jest już otwarty! 🎉"
}
```

---

### Zmiana 4 — Dashboard.jsx (1 linia)

```jsx
// przed:
<TodayChart />

// po:
<TodayChart sessionId={sessionId} />
```

---

## Risk Assessment

| Ryzyko | Prawdopodobieństwo | Mitygacja |
|--------|-------------------|-----------|
| `@ensure_csrf_cookie` zmienia kolejność istniejących dekoratorów | Niskie | Dekorator dodany na wierzchu, nie narusza logiki ratelimit |
| `fetchDateData` z `sessionId=null` wywołuje 401 | Niskie | `enabled: !!sessionId` w useQuery — żądanie nie jest wysyłane |
| Formatowanie daty przez `Intl` różni się między przeglądarkami | Niskie | `Intl` jest dostępny w ≥98% przeglądarek; fallback na `toLocaleDateString` |
| setInterval w CountdownCard wyciek pamięci | Niskie | Czyszczenie przez `return () => clearInterval(id)` w useEffect |
| Puste `date[]` z API powoduje crash ApexCharts | Niskie | Guard `if (isEmpty) return <komunikat>` przed renderowaniem Chart |
