import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import TodayChart from '../components/TodayChart.jsx'

// Mock TanStack Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}))

// Mock ApexCharts to avoid canvas issues in test environment
vi.mock('react-apexcharts', () => ({
  default: () => <div data-testid="apex-chart" />,
}))

vi.mock('../components/LoadingSpinner.jsx', () => ({
  default: () => <div data-testid="loading-spinner" />,
}))

import { useQuery } from '@tanstack/react-query'

const MOCK_DATA = {
  date: ['2026-05-06 08:00', '2026-05-06 09:00', '2026-05-06 10:00'],
  sport: [5, 10, 15],
  family: [3, 6, 9],
  small: [1, 2, 3],
  ice: [0, 0, 0],
  lastdate: '06.05.2026 10:00',
}
const AVAILABLE_DATES = ['2026-05-01', '2026-05-02', '2026-05-06']

function mockUseQueryMap({
  current = { data: MOCK_DATA, isLoading: false, isError: false },
  date = { data: MOCK_DATA, isLoading: false, isError: false },
  available = { data: { dates: AVAILABLE_DATES }, isLoading: false, isError: false },
} = {}) {
  useQuery.mockImplementation(({ queryKey }) => {
    if (queryKey[0] === 'available-dates') return available
    if (queryKey[0] === 'date') return date
    return current
  })
}

describe('TodayChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: data loaded, today's view + available dates ready
    mockUseQueryMap()
  })

  it('renders a date input with type="date"', () => {
    render(<TodayChart sessionId="abc" />)
    expect(document.querySelector('input[type="date"]')).toBeInTheDocument()
  })

  it('shows "Dzisiaj" as chart title by default', () => {
    render(<TodayChart sessionId="abc" />)
    expect(screen.getByText('Dzisiaj')).toBeInTheDocument()
  })

  it('hides the "Dzisiaj" button when today is selected (default)', () => {
    render(<TodayChart sessionId="abc" />)
    expect(screen.queryByRole('button', { name: /dzisiaj/i })).not.toBeInTheDocument()
  })

  it('shows the "Dzisiaj" button when a past date is selected', () => {
    render(<TodayChart sessionId="abc" />)
    const input = document.querySelector('input[type="date"]')
    fireEvent.change(input, { target: { value: AVAILABLE_DATES[0] } })
    expect(screen.getByRole('button', { name: /dzisiaj/i })).toBeInTheDocument()
  })

  it('clicking "Dzisiaj" button hides it again', () => {
    render(<TodayChart sessionId="abc" />)
    const input = document.querySelector('input[type="date"]')
    fireEvent.change(input, { target: { value: AVAILABLE_DATES[0] } })
    const btn = screen.getByRole('button', { name: /dzisiaj/i })
    fireEvent.click(btn)
    expect(screen.queryByRole('button', { name: /dzisiaj/i })).not.toBeInTheDocument()
  })

  it('shows "Brak danych z wybranego dnia." when API returns empty date array', () => {
    mockUseQueryMap({
      current: {
        data: { date: [], sport: [], family: [], small: [], ice: [] },
        isLoading: false,
        isError: false,
      },
    })
    render(<TodayChart sessionId="abc" />)
    expect(screen.getByText(/Brak danych z wybranego dnia/i)).toBeInTheDocument()
  })

  it('shows error message on query error', () => {
    mockUseQueryMap({
      current: { data: undefined, isLoading: false, isError: true },
    })
    render(<TodayChart sessionId="abc" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows loading spinner while loading', () => {
    mockUseQueryMap({
      current: { data: undefined, isLoading: true, isError: false },
    })
    render(<TodayChart sessionId="abc" />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('datepicker is enabled when sessionId is null', () => {
    render(<TodayChart sessionId={null} />)
    const input = document.querySelector('input[type="date"]')
    expect(input).not.toBeDisabled()
  })

  it('shows warning when selected day is not available in DB', () => {
    render(<TodayChart sessionId="abc" />)
    const input = document.querySelector('input[type="date"]')
    fireEvent.change(input, { target: { value: '2026-05-03' } })
    expect(screen.getByText(/nie ma danych w bazie/i)).toBeInTheDocument()
  })
})
