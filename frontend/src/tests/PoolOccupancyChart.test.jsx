import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../contexts/ThemeContext.jsx'
import PoolOccupancyChart from '../components/PoolOccupancyChart.jsx'
import PoolDetails from '../pages/PoolDetails.jsx'
import { POOLS } from '../components/FacilityGrid.jsx'
import useCurrentData from '../hooks/useCurrentData.js'

const chart = vi.hoisted(() => vi.fn())
vi.mock('react-apexcharts', () => ({ default: (props) => {
  chart(props)
  return <div data-testid="pool-chart" />
} }))
vi.mock('../hooks/useCurrentData.js', () => ({ default: vi.fn() }))

const data = {
  date: ['2026-09-26 08:00', '2026-09-26 08:05'],
  small: [0, 3], sport: [20, 25], family: [40, 45], ice: [60, 65],
}
const wrap = (ui) => <ThemeProvider>{ui}</ThemeProvider>
const latestChart = () => chart.mock.calls.at(-1)[0]

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  useCurrentData.mockReturnValue({ data, isLoading: false, isError: false, hasCurrentData: true })
})

describe('PoolOccupancyChart', () => {
  it.each(POOLS)('shows only measurements for $id', (pool) => {
    render(wrap(<PoolOccupancyChart pool={pool} data={data} />))
    expect(latestChart().series).toEqual([{ name: pool.label, data: [
      { x: '08:00', y: data[pool.id][0] }, { x: '08:05', y: data[pool.id][1] },
    ] }])
    expect(latestChart().options.yaxis.min).toBe(0)
    expect(latestChart().options.tooltip.y.formatter(25)).toBe('25 os.')
    expect(latestChart().options.tooltip.x.formatter(1, { dataPointIndex: 1 })).toBe('08:05')
  })

  it('replaces the series when the selected pool changes', () => {
    const { rerender } = render(wrap(<PoolOccupancyChart pool={POOLS[0]} data={data} />))
    rerender(wrap(<PoolOccupancyChart pool={POOLS[1]} data={data} />))
    expect(latestChart().series[0].name).toBe(POOLS[1].label)
    expect(latestChart().series[0].data.map(({ y }) => y)).toEqual(data.sport)
  })

  it.each([undefined, { date: [], small: [] }, { ...data, small: [] }, { ...data, small: [null, null] }])('shows an empty state for missing measurements', (emptyData) => {
    render(wrap(<PoolOccupancyChart pool={POOLS[0]} data={emptyData} />))
    expect(screen.getByText('Brak danych z bieżącego dnia.')).toBeInTheDocument()
    expect(chart).not.toHaveBeenCalled()
  })

  it('displays a marker for a single measurement, including zero', () => {
    render(wrap(<PoolOccupancyChart pool={POOLS[0]} data={{ date: [data.date[0]], small: [0] }} />))
    expect(latestChart().options.markers.size).toBeGreaterThan(0)
    expect(latestChart().series[0].data[0].y).toBe(0)
  })

  it('keeps cached measurements visible after a refresh error', () => {
    render(wrap(<PoolOccupancyChart pool={POOLS[0]} data={data} isError />))
    expect(screen.getByTestId('pool-chart')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Dane nieaktualne')
  })

  it.each(['light', 'dark'])('uses the %s tooltip theme', (theme) => {
    localStorage.setItem('theme', theme)
    render(wrap(<PoolOccupancyChart pool={POOLS[0]} data={data} />))
    expect(latestChart().options.tooltip.theme).toBe(theme)
  })
})

describe('PoolDetails chart placement', () => {
  function renderDetails(isModal = false) {
    return render(wrap(<MemoryRouter initialEntries={['/pool/small']}>
      <Routes><Route path="/pool/:id" element={<PoolDetails isModal={isModal} />} /></Routes>
    </MemoryRouter>))
  }

  it('places the chart above the current occupancy card in the sidebar', () => {
    renderDetails()
    const section = screen.getByRole('region', { name: 'Dzisiejsze obłożenie: Pływalnia Kameralna' })
    expect(section.parentElement.tagName).toBe('ASIDE')
    expect(section.nextElementSibling).toHaveTextContent('Aktualne obłożenie')
  })

  it('does not show the chart in the mobile panel', () => {
    renderDetails(true)
    expect(screen.queryByTestId('pool-chart')).not.toBeInTheDocument()
    expect(screen.getByText('Obłożenie')).toBeInTheDocument()
  })
})
