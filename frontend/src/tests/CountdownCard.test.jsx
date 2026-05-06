import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import CountdownCard from '../components/CountdownCard.jsx'

const AQUAPARK_URL =
  'https://www.lech.net.pl/pl/aktualnosci/bedziemy-budowac-aquapark-w-bialymstoku-.html'

describe('CountdownCard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Set a fixed date well before the target (2028-12-15)
    vi.setSystemTime(new Date('2026-05-06T10:00:00'))
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

  it('renders the construction emoji', () => {
    render(<CountdownCard />)
    expect(screen.getByText(/🏗️/)).toBeInTheDocument()
  })

  it('renders "Otwarcie za X dni" with a positive day count', () => {
    render(<CountdownCard />)
    expect(screen.getByText(/Otwarcie za \d+ dni/i)).toBeInTheDocument()
  })

  it('renders the hours/minutes/seconds countdown', () => {
    render(<CountdownCard />)
    expect(screen.getByText(/godzin.*minut.*sekund/i)).toBeInTheDocument()
  })

  it('renders two links pointing to the correct Lech article URL', () => {
    render(<CountdownCard />)
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThanOrEqual(2)
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', AQUAPARK_URL)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  it('renders "Aquapark jest już otwarty!" when the target date has passed', () => {
    // Set date AFTER 2028-12-15
    vi.setSystemTime(new Date('2029-01-01T00:00:00'))
    render(<CountdownCard />)
    expect(screen.getByText(/już otwarty/i)).toBeInTheDocument()
    expect(screen.queryByText(/Otwarcie za/i)).not.toBeInTheDocument()
  })

  it('updates the seconds counter after 1 second', () => {
    render(<CountdownCard />)
    const before = screen.getByText(/godzin.*minut.*sekund/i).textContent
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    const after = screen.getByText(/godzin.*minut.*sekund/i).textContent
    // The seconds value will differ
    expect(before).not.toBe(after)
  })
})
