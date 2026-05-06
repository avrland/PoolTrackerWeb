---
description: "Task list for 006-ui-datepicker-aquapark-csrf"
---

# Tasks: Wykres dnia z datepickerem, poprawka kafelka Aquapark i naprawa CSRF chatbota

**Input**: Design documents from `/specs/006-ui-datepicker-aquapark-csrf/`  
**Branch**: `006-ui-datepicker-aquapark-csrf`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

---

## Phase 1: Setup (Foundational — no user stories yet)

**Purpose**: Verify project state and ensure testing infrastructure is ready before modifying any source files.

- [ ] T001 Verify existing tests pass before any changes by running `npm run test:run` in `frontend/`

**Checkpoint**: All pre-existing tests green ✅

---

## Phase 2: User Story 4 — CSRF fix (Priority: P3, implements first due to zero-dependency)

**Goal**: Django sets the `csrftoken` cookie on the first GET to `/api/current/`, so the chatbot can POST without a 403 error.

**Independent Test**: After `docker compose up`, open the app in a fresh browser session, open DevTools → Network, send a chatbot message — response must be HTTP 200, not 403. Also verify `Set-Cookie: csrftoken=...` is present in the `/api/current/` response headers.

### Implementation for User Story 4

- [X] T002 [US4] Add `@ensure_csrf_cookie` decorator to `api_current_view` in `tablechart/chart_app/views.py` — import from `django.views.decorators.csrf` and place decorator above `@require_GET`

**Checkpoint**: Backend change is minimal (2 lines). No migrations required. Restart Django container to verify.

---

## Phase 3: User Story 2 — Czytelna legenda wykresu z godzinami (Priority: P1)

**Goal**: X-axis labels and tooltip on the TodayChart show real HH:MM timestamps, not ordinal numbers.

**Independent Test**: Open the app, look at the "Wykres dnia" chart — axis labels must show times like "08:00", "10:30". Hover over a data point — tooltip must show "HH:MM" not "1", "2", "3".

### Implementation for User Story 2

- [X] T003 [US2] Fix `CHART_OPTIONS` tooltip formatter in `frontend/src/components/TodayChart.jsx` — change `tooltip.x.formatter` from `(val) => val` to `(val, opts) => categories[opts.dataPointIndex] ?? val`

**Checkpoint**: Reload app, hover chart points — tooltip shows HH:MM. Axis labels unchanged (already correct via `categories` array).

---

## Phase 4: User Story 1 — Datepicker wykresu dnia (Priority: P1)

**Goal**: TodayChart gains a date picker and "Dzisiaj" button. Historical date data loads from `/get_date_data/`. Chart title updates accordingly.

**Independent Test**: Select yesterday's date from the date picker → chart reloads with historical data and title changes to the Polish-formatted date. Click "Dzisiaj" → chart returns to today's data, button disappears.

### Implementation for User Story 1

- [X] T004 [US1] Add `sessionId` prop to `<TodayChart>` in `frontend/src/pages/Dashboard.jsx` — change `<TodayChart />` to `<TodayChart sessionId={sessionId} />`
- [X] T005 [US1] Rewrite `frontend/src/components/TodayChart.jsx` to add: `selectedDate` state (default today), `isToday` derived flag, dual `useQuery` (shared `['current']` cache for today, `['date', selectedDate]` via `fetchDateData` for historical), Polish date title via `Intl.DateTimeFormat`, `<input type="date">` datepicker with `max={todayStr}` and `disabled={!sessionId}`, "Dzisiaj" button visible only when `!isToday`, empty-data guard showing "Brak danych z wybranego dnia."

**Checkpoint**: Date picker renders. Selecting a past date fetches and renders historical data. Selecting today reverts to cached current data without a new network request.

---

## Phase 5: User Story 3 — Kafelek Aquapark (Priority: P2)

**Goal**: CountdownCard shows full "Aquapark Andersa | Grudzień 2028" wording, 🏗️ symbol, live days+HH:MM:SS countdown, and two clickable links to the Lech article.

**Independent Test**: Open the app — card title reads "Aquapark Andersa | Grudzień 2028", 🏗️ is visible, "Otwarcie za X dni" and "Y godzin, Z minut, W sekund" are displayed and the seconds change every second. Clicking either text opens the correct URL in a new tab.

### Implementation for User Story 3

- [X] T006 [US3] Rewrite `frontend/src/components/CountdownCard.jsx` — remove `useQuery` dependency, add `useState(null)` for `countdown`, add `useEffect` with `setInterval(tick, 1000)` computing days/hours/minutes/seconds from `TARGET = new Date('2028-12-15T00:00:00')`, render: title "Aquapark Andersa | Grudzień 2028", 🏗️ symbol, `<a href={AQUAPARK_URL} target="_blank" rel="noopener noreferrer">Otwarcie za {days} dni</a>`, `<a href={AQUAPARK_URL} target="_blank" rel="noopener noreferrer">{hours} godzin, {minutes} minut, {seconds} sekund</a>`, fallback "Aquapark jest już otwarty! 🎉" when countdown is null

**Checkpoint**: Countdown visible and ticking. Both links open correct URL in new tab.

---

## Phase 6: Tests — Update frontend test suite

**Purpose**: Align existing tests with refactored component APIs; add assertions for new behaviour.

- [X] T007 [P] [US2] Update `frontend/src/tests/CountdownCard.test.jsx` — remove `useQuery` mock (no longer used), add tests for: title "Aquapark Andersa", span "Grudzień 2028", 🏗️ emoji visible, link `href` equals `https://www.lech.net.pl/pl/aktualnosci/bedziemy-budowac-aquapark-w-bialymstoku-.html`, countdown numbers visible (mock `Date` to a fixed time before TARGET)
- [X] T008 [P] [US1] Update or create `frontend/src/tests/TodayChart.test.jsx` — mock `fetchCurrentData` and `fetchDateData`; test: datepicker input rendered with `type="date"`, "Dzisiaj" button hidden when selected date equals today, "Dzisiaj" button visible when selected date differs, empty-data guard renders "Brak danych z wybranego dnia"
- [X] T009 Run `npm run test:run` in `frontend/` and confirm all tests pass

**Checkpoint**: Test suite green. No regressions.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, accessibility check, and clean-up.

- [X] T010 [P] Verify `rel="noopener noreferrer"` on all external links added in CountdownCard and that `target="_blank"` is set correctly
- [X] T011 [P] Verify datepicker `disabled` state is visually indicated (CSS `opacity`/`cursor: not-allowed`) when `sessionId` is null — check in `frontend/src/index.css` or inline style
- [X] T012 Perform quickstart.md scenario walkthrough: Scenario 1 (datepicker), Scenario 2 (aquapark card), Scenario 3 (chatbot CSRF), Scenario 4 (empty date)

**Checkpoint**: All quickstart scenarios pass. Feature ready for PR.

---

## Dependency Graph

```
T001 (baseline tests)
  └── T002 (CSRF backend fix)     ← independent, can run after T001
  └── T003 (tooltip fix)          ← independent
  └── T004 (Dashboard prop)
        └── T005 (TodayChart rewrite, needs T004)
  └── T006 (CountdownCard rewrite) ← independent of T003-T005
  └── T007 (CountdownCard tests)   ← after T006
  └── T008 (TodayChart tests)      ← after T005
T007 + T008
  └── T009 (run all tests)
T009
  └── T010, T011, T012 (polish)
```

## Parallel Execution Opportunities

- **After T001**: T002, T003, T004, T006 can all start in parallel (different files, no shared dependencies)
- **After T004**: T005 begins (Dashboard prop must exist before TodayChart is rewritten to consume it)
- **After T005 + T006**: T007 and T008 can run in parallel
- **After T009**: T010 and T011 can run in parallel

## Implementation Strategy

**MVP scope** (deliver value immediately): T001 → T002 (CSRF fix) + T003 (tooltip fix) — two minimal backend/frontend changes that fix existing bugs with zero risk.

**Full delivery order**: T001 → T002+T003+T004+T006 (parallel) → T005 → T007+T008 (parallel) → T009 → T010+T011+T012
