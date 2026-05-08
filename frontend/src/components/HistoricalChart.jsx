import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Chart from 'react-apexcharts'
import { fetchHistoricalData } from '../services/api.js'
import LoadingSpinner from './LoadingSpinner.jsx'

const DAY_NAMES = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']
const DAY_NAMES_FULL = [
  'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela',
]

// Align JS getDay() (Sun=0) to our scale (Mon=0)
function getTodayIndex() {
  const jsDay = new Date().getDay() // 0=Sun
  return jsDay === 0 ? 6 : jsDay - 1
}

const CHART_OPTIONS = (categories) => ({
  chart: {
    type: 'line',
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: true, speed: 300 },
  },
  stroke: { curve: 'smooth', width: 2 },
  xaxis: {
    categories,
    tickAmount: 6,
    labels: { rotate: 0, style: { fontSize: '11px' } },
  },
  yaxis: {
    min: 0,
    labels: { style: { fontSize: '11px' } },
  },
  legend: {
    position: 'top',
    horizontalAlign: 'left',
  },
  colors: ['#4e73df', '#1cc88a', '#f6c23e'],
  tooltip: {
    x: { formatter: (val, opts) => categories[opts.dataPointIndex] ?? val },
    y: { formatter: (val) => `${val} os.` },
  },
  grid: { borderColor: '#e9ecef' },
  responsive: [
    {
      breakpoint: 480,
      options: {
        legend: { position: 'bottom' },
      },
    },
  ],
})

export default function HistoricalChart() {
  const [selectedDay, setSelectedDay] = useState(getTodayIndex)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['historical', selectedDay],
    queryFn: () => fetchHistoricalData(selectedDay),
    staleTime: 24 * 60 * 60 * 1000, // 24 h — historical data changes rarely
  })

  const isEmpty =
    !data ||
    !Array.isArray(data.date_stat) ||
    data.date_stat.length === 0 ||
    data.date_stat === 0

  // Filter out entries before 06:00 — artefacts from the scrapper UTC offset correction
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
    <section aria-label="Wykresy historyczne">
      <nav className="day-tabs" aria-label="Wybór dnia tygodnia">
        {DAY_NAMES.map((name, idx) => (
          <button
            key={idx}
            type="button"
            className={`day-tab${idx === selectedDay ? ' day-tab--active' : ''}`}
            onClick={() => setSelectedDay(idx)}
            aria-pressed={idx === selectedDay}
            aria-label={DAY_NAMES_FULL[idx]}
          >
            {name}
          </button>
        ))}
      </nav>

      <div className="chart-wrapper">
        {isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <div className="error-message" role="alert">
            Błąd ładowania wykresu: {error.message}
          </div>
        ) : (isEmpty || isFilteredEmpty) ? (
          <p style={{ textAlign: 'center', color: '#6c757d', padding: '1rem' }}>
            Brak danych historycznych dla{' '}
            <strong>{data?.today ?? DAY_NAMES_FULL[selectedDay]}</strong>.
          </p>
        ) : (
          <Chart
            type="line"
            height={280}
            options={CHART_OPTIONS(filteredCategories)}
            series={series}
          />
        )}
      </div>
    </section>
  )
}
