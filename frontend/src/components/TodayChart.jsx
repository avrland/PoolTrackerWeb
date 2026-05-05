import { useQuery } from '@tanstack/react-query'
import Chart from 'react-apexcharts'
import { fetchCurrentData } from '../services/api.js'
import LoadingSpinner from './LoadingSpinner.jsx'

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
    x: { formatter: (val) => val },
    y: { formatter: (val) => `${val} os.` },
  },
  grid: { borderColor: '#e9ecef' },
  responsive: [{ breakpoint: 480, options: { legend: { position: 'bottom' } } }],
})

export default function TodayChart() {
  // Reuse the same cache key as CurrentOccupancy — zero extra network requests
  const { data, isLoading, isError } = useQuery({
    queryKey: ['current'],
    queryFn: fetchCurrentData,
    refetchInterval: 5 * 60 * 1000,
  })

  if (isLoading) return <LoadingSpinner />

  if (isError) {
    return (
      <div className="error-message" role="alert">
        Błąd ładowania wykresu dnia.
      </div>
    )
  }

  const isEmpty = !data || !Array.isArray(data.date) || data.date.length === 0

  if (isEmpty) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-muted)' }}>
        <p>Brak danych z bieżącego dnia.</p>
        {data?.opening != null && (
          <p>
            Sezon otwiera się za: <strong>{data.opening} dni</strong>
          </p>
        )}
      </div>
    )
  }

  const series = [
    { name: 'Sportowy', data: data.sport },
    { name: 'Rodzinny', data: data.family },
    { name: 'Mały',     data: data.small },
  ]

  // Extract HH:MM from "YYYY-MM-DD HH:MM" timestamps
  const categories = data.date.map((dt) => dt.slice(11, 16))

  return (
    <div className="chart-wrapper">
      <Chart
        type="line"
        height={260}
        options={CHART_OPTIONS(categories)}
        series={series}
      />
    </div>
  )
}
