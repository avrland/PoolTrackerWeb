import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CountdownCard from '../components/CountdownCard.jsx'

// Mock TanStack Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}))

// Mock LoadingSpinner to keep tests simple
vi.mock('../components/LoadingSpinner.jsx', () => ({
  default: () => <div data-testid="loading-spinner" />,
}))

import { useQuery } from '@tanstack/react-query'

describe('CountdownCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the days count when opening > 0', () => {
    useQuery.mockReturnValue({
      data: { opening: 937 },
      isLoading: false,
      isError: false,
    })

    render(<CountdownCard />)

    expect(screen.getByText('937')).toBeInTheDocument()
    expect(screen.getByText(/dni do otwarcia/i)).toBeInTheDocument()
    expect(screen.getByText(/Aquapark/i)).toBeInTheDocument()
  })

  it('renders "already open" message when opening === 0', () => {
    useQuery.mockReturnValue({
      data: { opening: 0 },
      isLoading: false,
      isError: false,
    })

    render(<CountdownCard />)

    expect(screen.getByText(/już otwarty/i)).toBeInTheDocument()
    expect(screen.queryByText(/dni do otwarcia/i)).not.toBeInTheDocument()
  })

  it('renders "already open" message when opening < 0', () => {
    useQuery.mockReturnValue({
      data: { opening: -5 },
      isLoading: false,
      isError: false,
    })

    render(<CountdownCard />)

    expect(screen.getByText(/już otwarty/i)).toBeInTheDocument()
  })

  it('renders a loading spinner while query is loading', () => {
    useQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })

    render(<CountdownCard />)

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.queryByText(/dni do otwarcia/i)).not.toBeInTheDocument()
  })

  it('renders null (nothing) when query errors', () => {
    useQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })

    const { container } = render(<CountdownCard />)

    expect(container).toBeEmptyDOMElement()
  })
})
