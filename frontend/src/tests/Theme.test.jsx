import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { ThemeProvider } from '../contexts/ThemeContext.jsx'
import DarkModeToggle from '../components/DarkModeToggle.jsx'
import TodayChart from '../components/TodayChart.jsx'
import HistoricalChart from '../components/HistoricalChart.jsx'

vi.mock('@tanstack/react-query', () => ({ useQuery: vi.fn() }))
vi.mock('react-apexcharts', () => ({
  default: ({ options }) => <output data-testid="chart-options">{JSON.stringify(options)}</output>,
}))
import { useQuery } from '@tanstack/react-query'

let media, listeners
beforeEach(() => {
  localStorage.clear()
  listeners = new Set()
  media = {
    matches: false,
    addEventListener: vi.fn((_, listener) => listeners.add(listener)),
    removeEventListener: vi.fn((_, listener) => listeners.delete(listener)),
  }
  vi.stubGlobal('matchMedia', vi.fn(() => media))
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear() })

function mount(children) {
  return render(<ThemeProvider><DarkModeToggle />{children}</ThemeProvider>)
}
function changeSystem(dark) {
  act(() => { media.matches = dark; listeners.forEach((listener) => listener()) })
}
function options() { return JSON.parse(screen.getByTestId('chart-options').textContent) }

describe('theme preference', () => {
  it('follows the system until an explicit keyboard choice, then persists it', async () => {
    const user = userEvent.setup()
    mount()
    expect(document.documentElement.dataset.theme).toBe('light')
    changeSystem(true)
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('theme')).toBeNull()
    await user.tab()
    await user.keyboard('{Enter}')
    expect(localStorage.getItem('theme')).toBe('light')
    expect(document.documentElement.style.colorScheme).toBe('light')
    changeSystem(false)
    changeSystem(true)
    expect(document.documentElement.dataset.theme).toBe('light')
    await user.keyboard(' ')
    expect(localStorage.getItem('theme')).toBe('dark')
    cleanup()
    media.matches = false
    mount()
    expect(screen.getByRole('button', { name: 'Przełącz na tryb jasny' })).toBeInTheDocument()
  })

  it.each(['invalid', null])('uses system dark with saved preference %s', (saved) => {
    if (saved) localStorage.setItem('theme', saved)
    media.matches = true
    mount()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('honors saved light even when the system is dark', () => {
    localStorage.setItem('theme', 'light')
    media.matches = true
    mount()
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('allows switching when storage access throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    media.matches = true
    mount()
    fireEvent.click(screen.getByRole('button'))
    expect(document.documentElement.dataset.theme).toBe('light')
    changeSystem(false)
    changeSystem(true)
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('removes the system listener on unmount', () => {
    const view = mount()
    expect(listeners.size).toBe(1)
    view.unmount()
    expect(listeners.size).toBe(0)
  })

  it.each(['dark', 'light', 'invalid', 'blocked'])('initializes before React consistently for %s storage', (saved) => {
    media.matches = true
    if (saved === 'blocked') {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    } else localStorage.setItem('theme', saved)
    const html = readFileSync('index.html', 'utf8')
    const bootstrap = html.match(/<script>([\s\S]*?)<\/script>/)[1]
    new Function(bootstrap)()
    const initial = document.documentElement.dataset.theme
    expect(initial).toBe(saved === 'light' ? 'light' : 'dark')
    mount()
    expect(document.documentElement.dataset.theme).toBe(initial)
    expect(document.documentElement.style.colorScheme).toBe(initial)
  })
})

describe('chart theme changes', () => {
  beforeEach(() => {
    const daily = { date: ['2026-05-01 08:00'], sport: [5], family: [3], small: [1], lastdate: '01.05.2026 08:00', session_id: 'test' }
    useQuery.mockImplementation(({ queryKey }) => ({
      isLoading: false, isError: false,
      data: queryKey[0] === 'available-dates' ? { dates: ['2026-05-01'] }
        : queryKey[0] === 'historical' ? { date_stat: ['08:00'], sport_stat: [5], family_stat: [3], small_stat: [1] }
        : daily,
    }))
  })

  function checkDarkChart() {
    fireEvent.click(screen.getByRole('button', { name: 'Przełącz na tryb ciemny' }))
    const chart = options()
    expect(chart.tooltip.theme).toBe('dark')
    expect(chart.colors).toEqual(['#60a5fa', '#fb923c', '#34d399'])
    expect(chart.chart.foreColor).toBe('#c1c6d6')
    expect(chart.legend.labels.colors).toBe('#c1c6d6')
    expect(chart.xaxis.labels.style.colors).toBe('#8b90a0')
    expect(chart.yaxis.labels.style.colors).toBe('#8b90a0')
    expect(chart.grid.borderColor).toBe('#414754')
    fireEvent.click(screen.getByRole('button', { name: 'Przełącz na tryb jasny' }))
    expect(options().tooltip.theme).toBe('light')
    expect(options().colors).toEqual(['#0D6EFD', '#FF771D', '#20C997'])
  }

  it('preserves the selected date through both themes', () => {
    mount(<TodayChart sessionId="test" />)
    const date = screen.getByLabelText('Wybierz datę')
    fireEvent.change(date, { target: { value: '2026-05-01' } })
    checkDarkChart()
    expect(date).toHaveValue('2026-05-01')
    expect(options().xaxis.categories).toEqual(['08:00'])
  })

  it('preserves the selected weekday through both themes', () => {
    mount(<HistoricalChart />)
    fireEvent.click(screen.getByRole('button', { name: 'Wtorek' }))
    checkDarkChart()
    expect(screen.getByRole('button', { name: 'Wtorek' })).toHaveAttribute('aria-pressed', 'true')
    expect(options().xaxis.categories).toEqual(['08:00'])
  })
})
