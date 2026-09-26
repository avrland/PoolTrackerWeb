import { useTheme } from '../contexts/ThemeContext.jsx'
import { chartTheme } from './chartTheme.js'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Chart from 'react-apexcharts'
import { fetchHistoricalData } from '../services/api.js'
import { ChartSkeleton } from './Skeleton.jsx'

const DAY_NAMES = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']
const DAY_NAMES_FULL = [
  'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela',
]

function getTodayIndex() {
  const jsDay = new Date().getDay()
  return jsDay === 0 ? 6 : jsDay - 1
}

const CHART_OPTIONS = (categories, theme, palette) => ({
  chart: {
    type: 'line',
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: true, speed: 300 },
    background: 'transparent',
    foreColor: palette.text,
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
  },
  stroke: { curve: 'smooth', width: 3 },
  xaxis: {
    categories,
    tickAmount: 6,
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { rotate: 0, style: { fontSize: '11px', colors: palette.muted } },
  },
  yaxis: {
    min: 0,
    labels: { style: { fontSize: '11px', colors: palette.muted } },
  },
  legend: {
    labels: { colors: palette.text },
    position: 'bottom', 
    horizontalAlign: 'center',
    fontSize: '11px',
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
    fontWeight: 700,
    textTransform: 'uppercase',
    markers: { radius: 12 },
    itemMargin: { horizontal: 10, vertical: 5 }
  },
  colors: palette.series,
  tooltip: {
    x: { formatter: (val, opts) => categories[opts.dataPointIndex] ?? val },
    y: { formatter: (val) => `${val} os.` },
    theme,
  },
  grid: { 
    borderColor: palette.grid,
    strokeDashArray: 4,
  },
})

export default function HistoricalChart() {
  const { theme } = useTheme()
  const palette = chartTheme(theme)
  const [selectedDay, setSelectedDay] = useState(getTodayIndex)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['historical', selectedDay],
    queryFn: () => fetchHistoricalData(selectedDay),
    staleTime: 24 * 60 * 60 * 1000,
  })

  const isEmpty =
    !data ||
    !Array.isArray(data.date_stat) ||
    data.date_stat.length === 0 ||
    data.date_stat === 0

  const validIndices = isEmpty
    ? []
    : data.date_stat
        .map((t, i) => (t >= '06:00' ? i : -1))
        .filter((i) => i !== -1)

  const filteredCategories = validIndices.map((i) => data.date_stat[i])
  const filteredSport      = validIndices.map((i) => data.sport_stat[i])
  const filteredFamily     = validIndices.map((i) => data.family_stat[i])
  const filteredSmall      = validIndices.map((i) => data.small_stat[i])

  const isFilteredEmpty = !isEmpty && filteredCategories.length === 0

  const series = (isEmpty || isFilteredEmpty)
    ? []
    : [
        { name: 'Pływalnia Sportowa', data: filteredSport },
        { name: 'Pływalnia Rodzinna', data: filteredFamily },
        { name: 'Pływalnia Kameralna', data: filteredSmall },
      ]

  return (
    <div className="flex flex-col gap-5">
      <nav className="flex flex-wrap gap-2" aria-label="Wybór dnia tygodnia">
        {DAY_NAMES.map((name, idx) => (
          <button
            key={idx}
            type="button"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              idx === selectedDay 
              ? 'bg-primary text-on-primary shadow-md'
              : 'bg-surface-control text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container-low'
            }`}
            onClick={() => setSelectedDay(idx)}
            aria-pressed={idx === selectedDay}
            aria-label={DAY_NAMES_FULL[idx]}
          >
            {name}
          </button>
        ))}
      </nav>

      <div className="w-full h-[280px] relative" aria-busy={isLoading && !data}>
        {isError && !isEmpty && <span role="status" className="absolute top-0 right-0 z-10 text-xs text-on-surface-variant">Dane nieaktualne</span>}
        {isLoading && !data ? (
          <ChartSkeleton />
        ) : isError && isEmpty ? (
          <div className="text-error text-center p-8 bg-error/5 rounded-2xl" role="alert">
            Błąd ładowania wykresu: {error.message}
          </div>
        ) : isEmpty || isFilteredEmpty ? (
          <div className="text-on-surface-variant text-center p-8 border border-dashed border-outline-variant/50 rounded-2xl">
            Brak danych historycznych dla tego dnia.
          </div>
        ) : (
          <Chart
            type="line"
            height="100%"
            options={CHART_OPTIONS(filteredCategories, theme, palette)}
            series={series}
          />
        )}
      </div>
    </div>
  )
}
