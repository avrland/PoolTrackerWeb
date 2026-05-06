# Quickstart: UI Fixes — Countdown Card, Historical Chart Legend, Ice Rink Icon

**Feature**: `005-ui-fixes-countdown-chart-icon`  
**Date**: 2026-05-06

---

## Developer Setup

No additional setup required. This feature modifies existing frontend React components only.
The development stack is already running.

```bash
# Start full stack (from repo root)
docker compose up --build

# Frontend dev server (hot reload) — if developing without Docker
cd frontend
npm install
npm run dev          # → http://localhost:5173
```

---

## Integration Scenarios

### Scenario 1: CountdownCard is always visible

**Setup**: Dashboard loads successfully (or with no data for the current day).

**Test manually**:
1. Open `http://localhost:5173` (or the Nginx-served URL).
2. In DevTools → Network, throttle to simulate "no today's data" by observing the API
   response (or temporarily note the `opening` value from `/api/current/`).
3. Scroll to the `extra-cards` row — the **Aquapark** card must be visible next to
   **Pogoda** and **Bądź na bieżąco** regardless of whether pool data is available.
4. Verify the card shows `{N} dni do otwarcia` where N matches the `opening` field in the
   API response (`/api/current/`).

**Expected**: Card is always present in the card row. The `isEmpty` sections of
`CurrentOccupancy` and `TodayChart` no longer mention days until opening.

---

### Scenario 2: Countdown card when aquapark is already open

**Setup**: Temporarily mock `data.opening` to a value ≤ 0 in `CountdownCard.jsx`
(e.g., hardcode `const opening = 0;` for a quick test).

**Expected**: Card shows "Aquapark jest już otwarty! 🎉" instead of a day count.

---

### Scenario 3: Historical chart tooltip shows time labels

**Setup**: Navigate to any day tab on the historical chart section.

**Test manually**:
1. Hover over any data point on the chart (or tap on mobile).
2. Observe the tooltip header line.

**Expected**: Tooltip header shows the actual time, e.g. `"08:30"`, not a number like `"3"`.

---

### Scenario 4: Historical chart starts at 06:00 or later

**Setup**: Select a day tab that historically had measurements starting before 06:00
(typically visible as a spike near the left edge at `23:xx`).

**Test manually**:
1. Check the leftmost x-axis label — it must be `≥ 06:00`.
2. Hover over the leftmost data point — tooltip must show `≥ 06:00`.

**Expected**: No data points with time labels earlier than `06:00` appear on the chart.

---

### Scenario 5: Ice rink icon

**Setup**: Dashboard loads with current data (all four pool cards visible).

**Test manually**:
1. Locate the **Lodowisko** tile.
2. The icon button must display ⛸️.
3. The three pool tiles (Sportowy, Rodzinny, Kameralny) must still display 🏊.

**Expected**: Ice icon differs from pool icons.

---

## Running Frontend Tests

```bash
cd frontend
npm test              # runs Vitest in watch mode
npm run test:run      # single run (CI mode)
```

The new `CountdownCard.test.jsx` covers:
- Renders the countdown number when `opening > 0`
- Renders the "already open" message when `opening <= 0`
- Renders a loading spinner while the query is loading
- Renders gracefully when the API call fails
