import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Chart from 'react-apexcharts'
import { fetchCurrentData, fetchDateData } from '../services/api.js'
import LoadingSpinner from './LoadingSpinner.jsx'

const todayStr = () => new Date().toISOString().slice(0, 10)

const CHART_OPTIONS = (categories) => ({
  chart: {
    type: 'line',
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: true, speed: 300 },
    background: 'transparent',
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
  legend: { position: 'top', horizontalAlign: 'left' },
  colors: ['#4e73df', '#1cc88a', '#f6c23e'],
  tooltip: {
    x: { formatter: (val, opts) => categories[opts.dataPointIndex] ?? val },
    y: { formatter: (val) => `${val} os.` },
  },
  grid: { borderColor: '#e9ecef' },
  responsive: [{ breakpoint: 480, options: { legend: { position: 'bottom' } } }],
})

function formatDatePL(dateStr) {
  // T12:00:00 prevents timezone shifting the date to previous day
  return new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr + 'T12:00:00'))
}

export default function TodayChart({ sessionId }) {
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const isToday = selectedDate === todayStr()

  const todayQuery = useQuery({
    queryKey: ['current'],
    queryFn: fetchCurrentData,
    refetchInterval: 5 * 60 * 1000,
    enabled: isToday,
  })

  const dateQuery = useQuery({
    queryKey: ['date', selectedDate],
    queryFn: () => fetchDateData(selectedDate, sessionId),
    enabled: !isToday && !!sessionId,
    staleTime: Infinity,
  })

  const { data, isLoading, isError } = isToday ? todayQuery : dateQuery

  const chartTitle = isToday ? 'Dzisiaj' : formatDatePL(selectedDate)
  const today = todayStr()

  function handleDateChange(e) {
    setSelectedDate(e.target.value)
  }

  function handleTodayClick() {
    setSelectedDate(todayStr())
  }

  const isEmpty = !data || !Array.isArray(data.date) || data.date.length === 0

  return (
    <div className="chart-wrapper">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '0.5rem',
          gap: '0.5rem',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '1rem' }}>{chartTitle}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {!isToday && (
            <button
              type="button"
              onClick={handleTodayClick}
              style={{
                padding: '0.25rem 0.75rem',
                fontSize: '0.85rem',
                borderRadius: '4px',
                border: '1px solid var(--color-primary, #4e73df)',
                background: 'transparent',
                color: 'var(--color-primary, #4e73df)',
                cursor: 'pointer',
              }}
            >
              Dzisiaj
            </button>
          )}
          <input
            type="date"
            value={selectedDate}
            max={today}
            disabled={!sessionId}
            onChange={handleDateChange}
            style={{
              fontSize: '0.85rem',
              padding: '0.2rem 0.4rem',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              cursor: sessionId ? 'pointer' : 'not-allowed',
              opacity: sessionId ? 1 : 0.5,
            }}
            aria-label="Wybierz datę"
          />
        </div>
      </div>

      {isLoading && <LoadingSpinner />}

      {!isLoading && isError && (
        <div className="error-message" role="alert">
          Błąd ładowania wykresu dnia.
        </div>
      )}

      {!isLoading && !isError && isEmpty && (
        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-muted)' }}>
          <p>Brak danych z wybranego dnia.</p>
        </div>
      )}

      {!isLoading && !isError && !isEmpty && (() => {
        const categories = data.date.map((dt) => dt.slice(11, 16))
        const series = [
          { name: 'Pływalnia Sportowa', data: data.sport },
          { name: 'Pływalnia Rodzinna', data: data.family },
          { name: 'Pływalnia Kameralna', data: data.small },
        ]
        return (
          <Chart
            type="line"
            height={260}
            options={CHART_OPTIONS(categories)}
            series={series}
          />
        )
      })()}
    </div>
  )
}
