# Tasks: UI Fixes — Countdown Card, Historical Chart Legend, Ice Rink Icon

**Feature Branch**: `005-ui-fixes-countdown-chart-icon`  
**Input**: Design documents from `/specs/005-ui-fixes-countdown-chart-icon/`  
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, quickstart.md ✓

**Tests**: Included for US1 (CountdownCard) per constitution requirement II (TDD).  
US2 and US3 are pure presentational fixes — tested via manual quickstart scenarios.

**Organization**: Tasks grouped by user story. US1 → US2 → US3. All three are frontend-only;
no foundational phase is needed (no new DB, no new endpoints, no new routing).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: `[US1]`, `[US2]`, `[US3]` — maps to user stories in spec.md
- Exact file paths included in every task description

---

## Phase 1: Setup

**Purpose**: Verify test runner is configured and any missing test infrastructure exists.

- [x] T001 Verify Vitest test setup in `frontend/src/tests/setup.js` is compatible with React Testing Library (check imports, confirm `@testing-library/react` is listed in `frontend/package.json`)

---

## Phase 2: User Story 1 — CountdownCard (Priority: P1) 🎯 MVP

**Goal**: Always-visible countdown card in the `extra-cards` row reusing the `['current']` TanStack Query cache.

**Independent Test**: Open dashboard → `extra-cards` row shows a card with a number and "dni do otwarcia" regardless of whether pool data is available for the current day. Removing CountdownCard reverts to old behaviour with no visible regression elsewhere.

### Tests for User Story 1

> **Write tests FIRST — they must FAIL before implementation**

- [x] T002 [P] [US1] Create unit test file `frontend/src/tests/CountdownCard.test.jsx` — scaffold describe/it blocks for: (a) renders days count when `opening > 0`, (b) renders "Aquapark jest już otwarty!" when `opening <= 0`, (c) renders LoadingSpinner while query is loading, (d) renders gracefully when query errors; mock `@tanstack/react-query` useQuery hook

### Implementation for User Story 1

- [x] T003 [US1] Create `frontend/src/components/CountdownCard.jsx` — component calls `useQuery({ queryKey: ['current'], queryFn: fetchCurrentData })`; renders `<article className="weather-card">` with title "Aquapark", `opening` days count (or "Aquapark jest już otwarty! 🎉" when `opening <= 0`), and subtitle "dni do otwarcia"; shows `<LoadingSpinner />` while loading; renders null on error (depends on T002 test file existing)
- [x] T004 [US1] Modify `frontend/src/pages/Dashboard.jsx` — import `CountdownCard` and add `<ErrorBoundary><CountdownCard /></ErrorBoundary>` inside the existing `.extra-cards` div, alongside `WeatherCard` and `FacebookCard`
- [x] T005 [P] [US1] Modify `frontend/src/components/CurrentOccupancy.jsx` — remove the `<p>Lodowisko otwarte za: <strong>{data.opening} dni</strong></p>` paragraph from the `isEmpty` branch (the `data?.opening` conditional)
- [x] T006 [P] [US1] Modify `frontend/src/components/TodayChart.jsx` — remove the `{data?.opening != null && (<p>Sezon otwiera się za: <strong>{data.opening} dni</strong></p>)}` block from the `isEmpty` branch

**Checkpoint**: CountdownCard always visible in card row. No countdown text appears in pool grid or today's chart empty state. Tests pass.

---

## Phase 3: User Story 2 — Historical Chart Tooltip + Data Filter (Priority: P2)

**Goal**: Tooltip shows HH:MM time label; no data points before 06:00 appear on chart.

**Independent Test**: Select any day tab on historical chart → hover a point → tooltip header shows time (e.g. "08:30") not a number. Leftmost x-axis label is ≥ 06:00.

### Implementation for User Story 2

- [x] T007 [US2] Modify `frontend/src/components/HistoricalChart.jsx` — after receiving `data`, compute `validIndices` (indices where `data.date_stat[i] >= '06:00'`), derive `filteredCategories`, `filteredSport`, `filteredFamily`, `filteredSmall` arrays; pass `filteredCategories` to `CHART_OPTIONS()`; update the `series` to use filtered arrays; fix `CHART_OPTIONS` tooltip `x.formatter` from `(val) => val` to `(val, opts) => filteredCategories[opts.dataPointIndex] ?? val`

**Checkpoint**: No pre-06:00 data points visible. Tooltip header shows HH:MM on hover. `isEmpty` guard still works correctly when all data is filtered out.

---

## Phase 4: User Story 3 — Ice Rink Icon (Priority: P3)

**Goal**: Lodowisko tile shows ⛸️; other tiles keep 🏊.

**Independent Test**: Dashboard loads → Lodowisko card shows ⛸️ icon, Sportowy/Rodzinny/Kameralny cards show 🏊.

### Implementation for User Story 3

- [x] T008 [US3] Modify `frontend/src/components/CurrentOccupancy.jsx` — add `icon` field to each entry in the `POOLS` constant: `'🏊'` for `sport`, `family`, `small`; `'⛸️'` for `ice`; replace the hardcoded `🏊` in the icon button JSX (`<span className="pool-card__icon">🏊</span>`) with `{pool.icon}`

**Checkpoint**: Ice tile shows skate emoji. Other tiles unchanged.

---

## Phase 5: Polish & Validation

**Purpose**: Final validation against quickstart scenarios and test run.

- [x] T009 [P] Run frontend tests: `cd frontend && npm run test:run` — all tests must pass including new `CountdownCard.test.jsx`
- [x] T010 [P] Manually verify quickstart.md Scenario 1 (CountdownCard always visible), Scenario 3 (tooltip shows HH:MM), Scenario 4 (no pre-06:00 data), Scenario 5 (ice icon) in browser

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (US1)**: Depends on Phase 1 (T001)
  - T002 must complete before T003 (test before implementation)
  - T003 must complete before T004 (component before Dashboard import)
  - T005 and T006 are [P] — can run in parallel with each other and with T003/T004
- **Phase 3 (US2)**: Independent of Phase 2 — can start after Phase 1
- **Phase 4 (US3)**: Independent of Phase 2 and 3 — can start after Phase 1
- **Phase 5 (Polish)**: Depends on T002–T008 all completed

### User Story Dependencies

- **US1**: No dependency on US2 or US3
- **US2**: No dependency on US1 or US3
- **US3**: No dependency on US1 or US2

### Within US1

- T002 (tests) → T003 (implementation) → T004 (Dashboard integration)
- T005 and T006 [P] are independent cleanup tasks

### Parallel Opportunities

After Phase 1 completes, all three user stories can begin in parallel:

```text
Phase 1: T001

Phase 2 (US1):           Phase 3 (US2):    Phase 4 (US3):
  T002 (test scaffold)     T007               T008
  T003 (CountdownCard)
  T004 (Dashboard)
  T005 [P] (remove from CurrentOccupancy)
  T006 [P] (remove from TodayChart)

Phase 5: T009 [P], T010 [P]
```

### Suggested MVP Scope

Only Phase 2 (US1) is strictly the "MVP" per spec priorities — CountdownCard is P1.
US2 and US3 (P2/P3) are independently deliverable after US1 or in parallel.
