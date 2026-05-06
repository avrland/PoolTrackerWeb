# Research: UI Fixes — Countdown Card, Historical Chart Legend, Ice Rink Icon

**Feature**: `005-ui-fixes-countdown-chart-icon`  
**Date**: 2026-05-06  
**Status**: Complete — all unknowns resolved

---

## Finding 1: ApexCharts tooltip x-formatter behavior (categorical x-axis)

**Context**: `HistoricalChart.jsx` uses `react-apexcharts@1.4.0` / `apexcharts@3.54.0` with a
`line` chart and `xaxis.categories` set to an array of HH:MM strings. The tooltip
`x.formatter` is currently `(val) => val`, but the tooltip displays a 1-based ordinal
number instead of the time label.

**Root cause**: In ApexCharts 3.x, when a line chart is rendered with a categorical x-axis
and the series data is a plain numeric array (not `{x, y}` objects), the `val` argument
passed to `tooltip.x.formatter` is the **1-based index** of the hovered data point, not
the category string. The category labels are used only for x-axis tick rendering, not for
the tooltip value.

**Decision**: Replace `(val) => val` with `(val, opts) => categories[opts.dataPointIndex]`
in both `HistoricalChart.jsx` and `TodayChart.jsx`. The `categories` array is already
available in the `CHART_OPTIONS` closure, so no structural change is needed.

**Alternatives considered**:
- Switching to `{x, y}` data format so ApexCharts uses the x value as label: rejected —
  would require restructuring all series data and backend integration; more invasive than a
  one-line formatter fix.
- Using `xaxis.type: 'datetime'` with parsed Date objects: rejected — overkill for time-
  of-day strings; would require extra parsing and timezone handling.

---

## Finding 2: Where `opening` is currently displayed and where to move it

**Context**: The API endpoint `/api/current/` returns an integer field `opening`
(days until 15 December 2028 aquapark opening). Currently it is displayed in two places:

| Location | Component | Condition |
|----------|-----------|-----------|
| `CurrentOccupancy.jsx` | Section `isEmpty` fallback | only when no data |
| `TodayChart.jsx` | `isEmpty` fallback paragraph | only when no data |

Both displays are opportunistic (only visible when there are no live data) and inconsistent.
The spec requires a permanent, always-visible card.

**Decision**: 
1. Create a new `CountdownCard.jsx` component that calls `useQuery({ queryKey: ['current'] })`
   — **zero additional network requests** because TanStack Query returns the already-cached
   result from `CurrentOccupancy`'s identical query.
2. Place `CountdownCard` inside the `extra-cards` div in `Dashboard.jsx`, alongside
   `WeatherCard` and `FacebookCard`.
3. Remove the countdown text from both `CurrentOccupancy.jsx` and `TodayChart.jsx` `isEmpty`
   branches.
4. When `data.opening <= 0`, the card shows "Aquapark jest już otwarty!" instead of a
   negative number.

**Alternatives considered**:
- Prop-drilling `opening` value from `CurrentOccupancy` up through `Dashboard` and down into
  a card: rejected — unnecessarily couples unrelated components; shared TanStack query cache
  solves this cleanly.
- Separate `/api/opening/` endpoint: rejected — no backend change warranted; field already
  exists in the current API response.

---

## Finding 3: Historical chart — filtering entries before 06:00

**Context**: The scrapper stores timestamps with a +1 h UTC offset in the naive
`poolstats_history.time` column. The backend corrects this by subtracting 1 h before
returning HH:MM strings. However, entries recorded near midnight (e.g., DB time `00:15`)
become `23:15` after the correction. Because `poolstats_history` groups rows by weekday
name (not by calendar date), a `23:15` entry on a Monday row is correctly labelled Monday
but represents a late-Sunday measurement. These entries corrupt the left end of the
historical chart.

**Decision**: Filter the data on the **frontend** before passing it to the chart. Any index
`i` where `data.date_stat[i] < '06:00'` (lexicographic comparison works for HH:MM) is
excluded along with its corresponding values in `sport_stat`, `family_stat`, and
`small_stat`. Backend is **not changed** — the filter is a presentation concern.

**Alternatives considered**:
- Fixing the backend SQL query to add a `HAVING time >= '06:00'` clause: rejected — the
  `poolstats_history` table stores time as a naive `TIME` column already offset by +1 h, so
  a SQL filter on `>= '06:00'` would incorrectly also exclude some valid 07:00 entries from
  the pre-correction view; the correction logic lives in Python, not SQL.
- Filtering in the existing `update_chart` Django view (Python): rejected — would be an
  invisible side-effect inside a view that currently applies only a 1-h time correction;
  keeping this in the frontend keeps the concern co-located with the chart rendering logic.

---

## Finding 4: Ice rink icon

**Context**: `CurrentOccupancy.jsx` renders a single `🏊` emoji icon for every pool card
using a hardcoded JSX span. There is no `icon` field in the `POOLS` array.

**Decision**: Add an `icon` field to each entry in the `POOLS` constant array. Set
`icon: '⛸️'` for the `ice` entry and `icon: '🏊'` for the three pool entries. Replace
the hardcoded `🏊` in the JSX with `{pool.icon}`.

**Alternatives considered**:
- Using a third-party icon library (FontAwesome, lucide-react): rejected — no icon library
  is currently installed; adding a dependency is disproportionate to a single emoji change.
- Conditional rendering inside JSX (`pool.key === 'ice' ? '⛸️' : '🏊'`): rejected —
  storing the icon in the data object is more maintainable and consistent with the existing
  pattern of pool metadata in the `POOLS` array.
