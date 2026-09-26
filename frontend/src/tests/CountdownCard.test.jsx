import { render, screen, act, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import CountdownCard from '../components/CountdownCard.jsx'

describe('CountdownCard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2028-12-14T12:00:00'))
  })
  afterEach(() => { cleanup(); vi.useRealTimers() })

  it('identifies the facility and scheduled month', () => {
    render(<CountdownCard />)
    expect(screen.getByRole('heading', { name: 'Aquapark Andersa' })).toBeInTheDocument()
    expect(screen.getByText('Grudzień 2028')).toBeInTheDocument()
  })

  it('shows the remaining days and hours', () => {
    render(<CountdownCard />)
    expect(screen.getByText('Otwarcie za 0 dni')).toBeInTheDocument()
    expect(screen.getByText('12h : 0m : 0s')).toBeInTheDocument()
  })

  it('updates the countdown after a second', () => {
    render(<CountdownCard />)
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getByText('11h : 59m : 59s')).toBeInTheDocument()
  })

  it('switches to the open state at the boundary', () => {
    vi.setSystemTime(new Date('2028-12-14T23:59:59'))
    render(<CountdownCard />)
    expect(screen.getByText('0h : 0m : 1s')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getByText(/Obiekt otwarty/)).toBeInTheDocument()
    expect(screen.queryByText(/Otwarcie za/)).not.toBeInTheDocument()
  })

  it('does not show negative values after opening', () => {
    vi.setSystemTime(new Date('2029-01-01T00:00:00'))
    render(<CountdownCard />)
    expect(screen.getByText(/Obiekt otwarty/)).toBeInTheDocument()
    expect(screen.queryByText(/Otwarcie za/)).not.toBeInTheDocument()
  })

  it('cleans up its timer on unmount', () => {
    const { unmount } = render(<CountdownCard />)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
