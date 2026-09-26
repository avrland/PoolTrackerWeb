# Research: Wykres dnia z datepickerem, poprawka kafelka Aquapark i naprawa CSRF chatbota

**Feature**: `006-ui-datepicker-aquapark-csrf`  
**Date**: 2026-05-06  
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## R-001: ApexCharts tooltip formatter z kategorii stringowych

**Decision**: Użyć `opts.dataPointIndex` zamiast `val` w `tooltip.x.formatter`, aby poprawnie wyświetlać godziny HH:MM zamiast liczb porządkowych.

**Rationale**: W ApexCharts, gdy oś X jest typu `"category"` i kategorie są stringami (np. `["08:00", "09:00"]`), parametr `val` w `tooltip.x.formatter(val)` zwraca **1-based numeryczny indeks** punktu danych, a nie wartość etykiety. Jest to znane zachowanie biblioteki. Jedynym poprawnym sposobem na odczyt rzeczywistej etykiety jest `categories[opts.dataPointIndex]`.

**Fix**: Zmiana w `CHART_OPTIONS`:
```js
tooltip: {
  x: { formatter: (val, opts) => categories[opts.dataPointIndex] ?? val },
  y: { formatter: (val) => `${val} os.` },
}
```

**Alternatives considered**:
- Zmiana `xaxis.type` na `'datetime'` i parsowanie timestampów — odrzucono, bo wymaga zmiany formatu danych z API i nie przynosi dodatkowych korzyści dla tego wykresu.
- Usunięcie `tooltip.x.formatter` — odrzucono, bo wróciłby indeks jako etykieta.

---

## R-002: CSRF cookie Django na widokach JSON API

**Decision**: Dodać dekorator `@ensure_csrf_cookie` do `api_current_view` w `chart_app/views.py`.

**Rationale**: Django ustawia ciasteczko `csrftoken` automatycznie tylko dla widoków renderujących szablony HTML przez `CsrfViewMiddleware`. Czysty widok JSON API nie gwarantuje ustawienia tego ciasteczka. Dekorator `@ensure_csrf_cookie` (z `django.views.decorators.csrf`) wymusza ustawienie nagłówka `Set-Cookie: csrftoken=...` w odpowiedzi GET, co pozwala przeglądarce uzyskać token potrzebny do kolejnych żądań POST chatbota.

**Diagnostics**: Błąd "CSRF verification failed. Request aborted." pojawia się, ponieważ:
1. Strona React SPA ładuje się przez `/api/current/` jako pierwsze żądanie.
2. Bez `@ensure_csrf_cookie`, Django nie ustawia ciasteczka `csrftoken` na tym endpoincie.
3. Chatbot pobiera token przez `getCsrfToken()` z `document.cookie` — jeśli ciasteczko nie istnieje, zwraca `null`.
4. Django odrzuca POST z brakującym lub pustym tokenem CSRF.

**Fix**:
```python
from django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie
@require_GET
@ratelimit(key='ip', rate='60/m', method='GET', block=True)
def api_current_view(request):
    ...
```

**Alternatives considered**:
- `@csrf_exempt` na chatbot view — odrzucono, bo znosi ochronę CSRF na endpoincie, co jest naruszeniem bezpieczeństwa.
- Dodanie osobnego GET endpointu `/api/csrf/` zwracającego token — odrzucono, bo niepotrzebnie komplikuje flow (dodatkowe żądanie sieciowe).
- Przeniesienie obsługi CSRF na poziom nginx — odrzucono, bo jest poza kontrolą aplikacji.

---

## R-003: Datepicker w TodayChart — integracja z fetchDateData

**Decision**: `TodayChart` akceptuje prop `sessionId` z komponentu Dashboard i używa `fetchDateData(date, sessionId)` dla dat historycznych, zachowując `queryKey: ['current']` (wspólna cache) dla dnia dzisiejszego.

**Rationale**:
- `fetchCurrentData` i `CurrentOccupancy` już współdzielą cache pod kluczem `['current']` — `TodayChart` korzysta z tej samej cache, co eliminuje zbędne żądania sieciowe. Musi to pozostać bez zmian dla trybu „Dzisiaj".
- `fetchDateData` wymaga `sessionId` jako nagłówka `X-Session-Key` (walidacja sesji po stronie backendu). `sessionId` jest już dostępny w `Dashboard.jsx` jako stan zainicjalizowany przez `CurrentOccupancy` przez callback `onSessionId`.
- Dopóki `sessionId` jest `null` (przed pierwszą odpowiedzią `fetchCurrentData`), datepicker jest wyłączony — użytkownik nie może wybrać historycznej daty przed załadowaniem bieżących danych.

**Flow**:
```
Dashboard
├── sessionId state (null → "abc123" po pierwszej odpowiedzi)
├── <CurrentOccupancy onSessionId={setSessionId} />  ← ustawia sessionId
└── <TodayChart sessionId={sessionId} />              ← używa sessionId dla fetchDateData
```

**State w TodayChart**:
- `selectedDate: string` — format `"YYYY-MM-DD"`, default `todayStr`
- `isToday: boolean` — `selectedDate === todayStr`
- Jeśli `isToday` → `useQuery(['current'], fetchCurrentData)` (cache shared, brak nowego żądania)
- Jeśli `!isToday` → `useQuery(['date', selectedDate], () => fetchDateData(selectedDate, sessionId), { enabled: !!sessionId })`

**Polish date formatting**: Użycie `Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })` dostępnego natywnie w przeglądarce — bez dodatkowych bibliotek.

**Alternatives considered**:
- Przechowywanie `sessionId` w React Query cache zamiast w stanie Dashboard — odrzucono, bo jest to dane sesji, nie dane serwerowe.
- Wymaganie od backendu nowego endpointu bez walidacji sesji — odrzucono ze względów bezpieczeństwa; istniejący endpoint już waliduje sesję.

---

## R-004: Licznik Aquaparku w CountdownCard — czysty klient bez API

**Decision**: Usunąć zależność `CountdownCard` od `useQuery`/API. Obliczać odliczanie wyłącznie po stronie klienta za pomocą `useEffect` + `setInterval`.

**Rationale**: Pole `opening` z API (`days_until_opening()`) zwraca jedynie liczbę dni — bez godzin, minut i sekund potrzebnych do pełnego licznika. Skoro i tak musimy obliczyć sub-dzienne składowe po stronie klienta na podstawie `new Date('2028-12-15T00:00:00')`, całkowite usunięcie zależności API upraszcza komponent. Eliminuje też sytuację, gdzie licznik wyświetla się dopiero po załadowaniu `['current']`.

**Target date**: `2028-12-15T00:00:00` — czas lokalny (Warsaw), tak jak w starym frontendzie Django.

**Implementation**:
```js
const TARGET = new Date('2028-12-15T00:00:00')
useEffect(() => {
  const tick = () => { /* oblicz distance, days, hours, minutes, seconds */ }
  tick()
  const id = setInterval(tick, 1000)
  return () => clearInterval(id)
}, [])
```

**Alternatives considered**:
- Zachowanie `useQuery` dla dni + `setInterval` dla sub-dziennych składowych — odrzucono, bo powoduje brak spójności (API zwraca dni jako integer zaokrąglony w dół, a klient oblicza je niezależnie i tak).
- Użycie zewnętrznej biblioteki countdown (np. `react-countdown`) — odrzucono, brak potrzeby dodawania zależności.
