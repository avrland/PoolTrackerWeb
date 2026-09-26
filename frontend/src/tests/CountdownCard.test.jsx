import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import CountdownCard from '../components/CountdownCard.jsx'

describe('CountdownCard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // A fixed distance avoids daylight-saving differences between local and CI timezones.
    const target = new Date('2028-12-15T00:00:00')
    vi.setSystemTime(new Date(target.getTime() - (10 * 24 + 14) * 60 * 60 * 1000))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the Aquapark Andersa title', () => {
    render(<CountdownCard />)
    expect(screen.getByText(/Aquapark Andersa/i)).toBeInTheDocument()
  })

  it('renders Grudzień 2028 subtitle', () => {
    render(<CountdownCard />)
    expect(screen.getByText(/Grudzień 2028/i)).toBeInTheDocument()
  })

  it('switches to the opened state at the target time', () => {
    vi.setSystemTime(new Date('2028-12-14T23:59:59'))
    render(<CountdownCard />)
    expect(screen.getByText(/0h : 0m : 1s/)).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(1000) })
    expect(screen.getByText(/Obiekt otwarty/i)).toBeInTheDocument()
    expect(screen.queryByText(/Otwarcie za/i)).not.toBeInTheDocument()
  })

  it('renders "Otwarcie za X dni" with a positive day count', () => {
    render(<CountdownCard />)
    expect(screen.getByText(/Otwarcie za \d+ dni/i)).toBeInTheDocument()
  })

  it('renders the hours/minutes/seconds countdown', () => {
    render(<CountdownCard />)
    expect(screen.getByText(/14h : 0m : 0s/)).toBeInTheDocument()
  })

  it('cleans up the countdown timer when unmounted', () => {
    const { unmount } = render(<CountdownCard />)
    expect(vi.getTimerCount()).toBe(1)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('renders "Obiekt otwarty!" when the target date has passed', () => {
    // Set date AFTER 2028-12-15
    vi.setSystemTime(new Date('2029-01-01T00:00:00'))
    render(<CountdownCard />)
    expect(screen.getByText(/Obiekt otwarty/i)).toBeInTheDocument()
    expect(screen.queryByText(/Otwarcie za/i)).not.toBeInTheDocument()
  })

  it('updates the seconds counter after 1 second', () => {
    render(<CountdownCard />)
    expect(screen.getByText(/14h : 0m : 0s/)).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByText(/13h : 59m : 59s/)).toBeInTheDocument()
  })
})
