import Chart from 'react-apexcharts'
import { useTheme } from '../contexts/ThemeContext.jsx'
import { chartTheme } from './chartTheme.js'

export default function PoolOccupancyChart({ pool, data, isError = false }) {
  const { theme } = useTheme()
  const palette = chartTheme(theme)
  const dates = Array.isArray(data?.date) ? data.date : []
  const values = Array.isArray(data?.[pool.id]) ? data[pool.id] : []
  const points = dates.map((date, index) => ({
    // API timestamps are already expressed in Warsaw local time.
    x: date.slice(11, 16),
    y: Number.isFinite(values[index]) ? values[index] : null,
  }))
  const measurementCount = points.filter(({ y }) => y !== null).length
  const options = {
    chart: {
      type: 'line',
      toolbar: { show: false },
      zoom: { enabled: false },
      background: 'transparent',
      foreColor: palette.text,
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    colors: [palette.series[0]],
    stroke: { curve: 'smooth', width: 3 },
    markers: { size: measurementCount === 1 ? 4 : 0, hover: { size: 5 } },
    xaxis: {
      type: 'category',
      tickAmount: 4,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { rotate: 0, hideOverlappingLabels: true, style: { colors: palette.muted, fontSize: '11px' } },
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      decimalsInFloat: 0,
      labels: { style: { colors: palette.muted, fontSize: '11px' } },
    },
    legend: { show: false },
    dataLabels: { enabled: false },
    tooltip: {
      theme,
      x: { formatter: (value, { dataPointIndex }) => points[dataPointIndex]?.x ?? value },
      y: { formatter: (value) => `${value} os.` },
    },
    grid: { borderColor: palette.grid, strokeDashArray: 4 },
  }

  return (
    <section aria-label={`Dzisiejsze obłożenie: ${pool.label}`} className="min-w-0 bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md shadow-md">
      <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Wykres obłożenia – Dzisiaj</h3>
      <p className="text-body-sm text-on-surface-variant mt-1">Liczba osób w ciągu dnia</p>
      {isError && measurementCount > 0 && <p role="status" className="text-xs text-on-surface-variant mt-2">Dane nieaktualne</p>}
      <div className="h-[220px] mt-2">
        {measurementCount > 0 ? (
          <Chart type="line" height={220} options={options} series={[{ name: pool.label, data: points }]} />
        ) : (
          <div className="h-full flex items-center justify-center text-center text-body-sm text-on-surface-variant">
            Brak danych z bieżącego dnia.
          </div>
        )}
      </div>
    </section>
  )
}
