import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import CurrentStatus from '../components/CurrentStatus.jsx'
import FacilityGrid from '../components/FacilityGrid.jsx'
import HistoricalChart from '../components/HistoricalChart.jsx'
import WeatherCard from '../components/WeatherCard.jsx'
import { fetchCurrentData, fetchHistoricalData, fetchWeather } from '../services/api.js'

vi.mock('../services/api.js', () => ({
  fetchCurrentData: vi.fn(),
  fetchHistoricalData: vi.fn(),
  fetchWeather: vi.fn(),
}))
vi.mock('react-apexcharts', () => ({ default: () => <div data-testid="apex-chart" /> }))

const CURRENT = {
  lastdate: '25.09.2026 10:00', session_id: 'session',
  lastsport: 12, lastfamily: 4, lastsmall: 1, lastice: 0,
  sport_percent: 12, family_percent: 3, small_percent: 3,
}

function deferred() {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

let client
function mount(children) {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>,
  )
}
function CurrentView() {
  return <><CurrentStatus showTotal /><CurrentStatus /><FacilityGrid /></>
}

beforeEach(() => {
  vi.resetAllMocks()
  client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } } })
})
afterEach(() => { cleanup(); client.clear() })

describe('current data loading states', () => {
  it('shares the first request, shows four named placeholders, then real data', async () => {
    const request = deferred()
    fetchCurrentData.mockReturnValue(request.promise)
    mount(<CurrentView />)
    expect(screen.getAllByText('Ładowanie danych')).toHaveLength(2)
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4)
    expect(screen.getByRole('region', { name: 'Kafelki obiektów' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText(/Teraz pływa/)).not.toBeInTheDocument()
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Szczegóły/ })).not.toBeInTheDocument()
    await act(async () => request.resolve(CURRENT))
    expect(await screen.findByText('Teraz pływa łącznie 17 osób')).toBeInTheDocument()
    expect(screen.getByText('LIVE')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Szczegóły/ })).toHaveLength(3)
    expect(fetchCurrentData).toHaveBeenCalledTimes(1)
  })

  it('shows a real zero only after a valid response', async () => {
    fetchCurrentData.mockResolvedValue({ ...CURRENT, lastsport: 0, lastfamily: 0, lastsmall: 0 })
    mount(<CurrentView />)
    expect(await screen.findByText('Teraz pływa łącznie 0 osób')).toBeInTheDocument()
    expect(screen.getByText('LIVE')).toBeInTheDocument()
  })

  it('does not mark an empty response as live', async () => {
    fetchCurrentData.mockResolvedValue({ lastdate: null })
    mount(<CurrentView />)
    expect(await screen.findAllByText('Dane niedostępne')).toHaveLength(2)
    expect(screen.getByText('Brak danych z bieżącego dnia.')).toBeInTheDocument()
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument()
    expect(screen.queryByText(/Teraz pływa/)).not.toBeInTheDocument()
  })

  it('offers a retry when the initial request fails', async () => {
    fetchCurrentData.mockRejectedValue(new Error('Offline'))
    mount(<CurrentView />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Offline')
    expect(screen.getAllByText('Dane niedostępne')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Spróbuj ponownie' })).toBeInTheDocument()
    expect(screen.queryByText(/Teraz pływa/)).not.toBeInTheDocument()
  })

  it('keeps cached values while refreshing and marks them stale after failure, then recovers', async () => {
    client.setQueryData(['current'], CURRENT)
    const request = deferred()
    fetchCurrentData.mockReturnValueOnce(request.promise)
    mount(<CurrentView />)
    let refresh
    act(() => { refresh = client.invalidateQueries({ queryKey: ['current'] }) })
    expect(screen.getByText('Teraz pływa łącznie 17 osób')).toBeInTheDocument()
    expect(screen.queryByText('Ładowanie zajętości obiektów')).not.toBeInTheDocument()
    await act(async () => { request.reject(new Error('Offline')); await refresh })
    expect(await screen.findByText('Ostatnio: 17 osób · Dane nieaktualne')).toBeInTheDocument()
    expect(screen.getByText('Dane nieaktualne')).toBeInTheDocument()
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Szczegóły/ })).toHaveLength(3)
    fetchCurrentData.mockResolvedValue({ ...CURRENT, lastsport: 13 })
    await act(async () => { await client.invalidateQueries({ queryKey: ['current'] }) })
    expect(await screen.findByText('Teraz pływa łącznie 18 osób')).toBeInTheDocument()
    expect(screen.getByText('LIVE')).toBeInTheDocument()
  })
})

describe('weather and history', () => {
  it('replaces weather placeholders with values including zero', async () => {
    const request = deferred()
    fetchWeather.mockReturnValue(request.promise)
    mount(<WeatherCard />)
    expect(screen.getByRole('status')).toHaveTextContent('Ładowanie pogody')
    expect(screen.queryByText('--°C')).not.toBeInTheDocument()
    await act(async () => request.resolve({ temp: 0, feels_like: 0, humidity: 0, description: 'Bezchmurnie', icon: '01d' }))
    expect(await screen.findByText('0°C')).toBeInTheDocument()
    expect(screen.getByText(/Odc: 0°C/)).toHaveTextContent('Wilg: 0%')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows no weather data after an initial error', async () => {
    // This card intentionally retries once.
    client.setQueryDefaults(['weather'], { retryDelay: 0 })
    fetchWeather.mockRejectedValue(new Error('Offline'))
    mount(<WeatherCard />)
    expect(await screen.findByText('Brak danych')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('reserves history chart space during loading and after an empty response', async () => {
    const request = deferred()
    fetchHistoricalData.mockReturnValue(request.promise)
    mount(<HistoricalChart />)
    const chartArea = screen.getByRole('status', { name: 'Ładowanie wykresu' }).parentElement
    expect(chartArea).toHaveClass('h-[280px]')
    await act(async () => request.resolve({ date_stat: [] }))
    expect(await screen.findByText('Brak danych historycznych dla tego dnia.')).toBeInTheDocument()
    expect(chartArea).toHaveClass('h-[280px]')
    expect(screen.queryByTestId('apex-chart')).not.toBeInTheDocument()
  })

  it('keeps historical data visible after a refresh error', async () => {
    fetchHistoricalData.mockResolvedValue({ date_stat: ['08:00'], sport_stat: [1], family_stat: [2], small_stat: [3] })
    mount(<HistoricalChart />)
    expect(await screen.findByTestId('apex-chart')).toBeInTheDocument()
    fetchHistoricalData.mockRejectedValue(new Error('Offline'))
    await act(async () => { await client.invalidateQueries({ queryKey: ['historical'] }) })
    await waitFor(() => expect(screen.getByText('Dane nieaktualne')).toBeInTheDocument())
    expect(screen.getByTestId('apex-chart')).toBeInTheDocument()
  })
})
