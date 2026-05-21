import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Chart from 'react-apexcharts'
import { fetchAvailableDates, fetchCurrentData, fetchDateData } from '../services/api.js'
import LoadingSpinner from './LoadingSpinner.jsx'

const todayStr = () => new Date().toISOString().slice(0, 10)

const CHART_OPTIONS = (categories) => ({
  chart: {
    type: 'line',
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: true, speed: 300 },
    background: 'transparent',
    fontFamily: 'Inter, sans-serif',
  },
  stroke: { curve: 'smooth', width: 3 },
  xaxis: {
    categories,
    tickAmount: 6,
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { rotate: 0, style: { fontSize: '11px', colors: '#727787' } },
  },
  yaxis: {
    min: 0,
    labels: { style: { fontSize: '11px', colors: '#727787' } },
  },
  legend: { 
    position: 'bottom', 
    horizontalAlign: 'center',
    fontSize: '11px',
    fontFamily: 'Inter',
    fontWeight: 700,
    textTransform: 'uppercase',
    markers: { radius: 12 },
    itemMargin: { horizontal: 10, vertical: 5 }
  },
  colors: ['#0D6EFD', '#FF771D', '#20C997'],
  tooltip: {
    x: { formatter: (val, opts) => categories[opts.dataPointIndex] ?? val },
    y: { formatter: (val) => `${val} os.` },
    theme: 'light',
  },
  grid: { 
    borderColor: '#e1e2ee',
    strokeDashArray: 4,
    padding: { left: 10, right: 10 }
  },
})

function formatDatePL(dateStr) {
  return new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr + 'T12:00:00'))
}

export default function TodayChart({ sessionId }) {
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [dateError, setDateError] = useState('')
  const isToday = selectedDate === todayStr()

  const todayQuery = useQuery({
    queryKey: ['current'],
    queryFn: fetchCurrentData,
    refetchInterval: 5 * 60 * 1000,
    enabled: isToday,
  })

  const availableDatesQuery = useQuery({
    queryKey: ['available-dates'],
    queryFn: fetchAvailableDates,
    staleTime: 10 * 60 * 1000,
  })

  const availableDates = availableDatesQuery.data?.dates ?? []
  const availableDateSet = useMemo(() => new Set(availableDates), [availableDates])
  const effectiveSessionId = sessionId ?? todayQuery.data?.session_id ?? null

  const dateQuery = useQuery({
    queryKey: ['date', selectedDate],
    queryFn: () => fetchDateData(selectedDate, effectiveSessionId),
    enabled: !isToday && !!effectiveSessionId && availableDateSet.has(selectedDate),
    staleTime: Infinity,
  })

  const { data, isLoading, isError } = isToday ? todayQuery : dateQuery

  const chartTitle = isToday ? 'Dzisiaj' : formatDatePL(selectedDate)
  const today = todayStr()
  const minAvailableDate = availableDates.length > 0 ? availableDates[0] : undefined
  const maxAvailableDate = availableDates.length > 0 ? availableDates[availableDates.length - 1] : today

  function handleDateChange(e) {
    const nextDate = e.target.value
    if (!nextDate) return

    if (nextDate === today || availableDateSet.has(nextDate)) {
      setDateError('')
      setSelectedDate(nextDate)
      return
    }

    setDateError('Wybrany dzień nie ma danych w bazie.')
  }

  function handleTodayClick() {
    setSelectedDate(todayStr())
  }

  const isEmpty = !data || !Array.isArray(data.date) || data.date.length === 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center pb-2">
        <span className="font-headline-sm text-lg text-on-surface font-semibold">{chartTitle}</span>
        <div className="flex items-center gap-2">
          {!isToday && (
            <button
              type="button"
              onClick={handleTodayClick}
              className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors"
            >
              Dzisiaj
            </button>
          )}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              min={minAvailableDate}
              max={maxAvailableDate}
              onChange={handleDateChange}
              list="available-chart-days"
              className="flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white border border-outline-variant/30 rounded-xl text-sm font-medium transition-colors shadow-sm cursor-pointer"
              aria-label="Wybierz datę"
            />
            <datalist id="available-chart-days">
              {availableDates.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
        </div>
      </div>

      {dateError && (
        <div className="text-error text-xs font-medium">
          {dateError}
        </div>
      )}

      {isLoading && <LoadingSpinner />}

      {!isLoading && isError && (
        <div className="text-error text-center p-8 bg-error/5 rounded-2xl" role="alert">
          Błąd ładowania wykresu dnia.
        </div>
      )}

      {!isLoading && !isError && isEmpty && (
        <div className="text-on-surface-variant text-center p-8 border border-dashed border-outline-variant/50 rounded-2xl">
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
          <div className="w-full h-[320px] mt-2">
             <Chart
              type="line"
              height="100%"
              options={CHART_OPTIONS(categories)}
              series={series}
            />
          </div>
        )
      })()}
    </div>
  )
}
