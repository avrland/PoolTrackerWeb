# Data Model: UI Fixes — Countdown Card, Historical Chart Legend, Ice Rink Icon

**Feature**: `005-ui-fixes-countdown-chart-icon`  
**Date**: 2026-05-06

This feature operates exclusively on the **presentation layer**. No new database tables,
no new API endpoints, and no backend schema changes are required.

---

## Existing API Data Consumed (read-only)

### `/api/current/` response — relevant fields

| Field | Type | Description |
|-------|------|-------------|
| `opening` | `integer` | Days remaining until aquapark opening (15 Dec 2028). Negative when date has passed. |
| `date` | `string[]` | Timestamps of today's measurements, format `"YYYY-MM-DD HH:MM"` |

The `opening` field is already returned by the existing Django view (`days_until_opening()`).
**No changes to backend.**

### `/update_chart/stats{day}` response — relevant fields

| Field | Type | Description |
|-------|------|-------------|
| `date_stat` | `string[]` | Time labels for x-axis, format `"HH:MM"`. May include entries before `"06:00"` due to scrapper UTC offset artefact. |
| `sport_stat` | `number[]` | Occupancy values aligned 1:1 with `date_stat` |
| `family_stat` | `number[]` | Occupancy values aligned 1:1 with `date_stat` |
| `small_stat` | `number[]` | Occupancy values aligned 1:1 with `date_stat` |

---

## Frontend Data Transformations

### CountdownCard — opening state derivation

```text
Input:  data.opening  (integer from cache)
Output: displayValue  (string | number)

Rule:
  if data.opening > 0  → displayValue = data.opening  (show days number)
  if data.opening <= 0 → displayValue = "Aquapark jest już otwarty! 🎉"  (opening passed)
```

### HistoricalChart — data filtering (before 06:00)

```text
Input:  data.date_stat[]  (HH:MM strings, may contain entries like "23:15")
Output: filteredCategories[], filteredSport[], filteredFamily[], filteredSmall[]

Rule:
  validIndices = date_stat.map((t, i) => t >= "06:00" ? i : -1).filter(i => i !== -1)
  filteredCategories = validIndices.map(i => date_stat[i])
  filteredSport      = validIndices.map(i => sport_stat[i])
  filteredFamily     = validIndices.map(i => family_stat[i])
  filteredSmall      = validIndices.map(i => small_stat[i])
```

### POOLS constant — icon field

```text
Entity: Pool (frontend constant, not persisted)

Fields:
  key       string   — "sport" | "family" | "small" | "ice"
  label     string   — display name (Polish)
  lastKey   string   — API response field name for latest count
  pctKey    string   — API response field name for percentage
  capacity  number   — maximum occupancy
  address   string   — physical address
  mapsUrl   string   — Google Maps deep link
  hours     object   — day-of-week → opening hours string
  icon      string   ← NEW FIELD: emoji icon
                       "🏊" for sport / family / small
                       "⛸️" for ice
```

---

## No New Entities

This feature introduces no new data entities, database migrations, Redux/Zustand slices,
or localStorage keys.
