const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

/**
 * Fetches current pool occupancy data for today.
 * Creates/updates Django session — the returned session_id is required
 * for authenticated requests like fetchDateData().
 */
export async function fetchCurrentData() {
  const response = await fetch(`${BASE_URL}/api/current/`, {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(`API error ${response.status}`)
  }
  return response.json()
}

/**
 * Fetches historical occupancy data averaged by day of week.
 * @param {number} day - 0 = Monday, 6 = Sunday
 */
export async function fetchHistoricalData(day) {
  const response = await fetch(`${BASE_URL}/update_chart/stats${day}`, {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(`API error ${response.status}`)
  }
  return response.json()
}

/**
 * Fetches occupancy data for a specific date.
 * @param {string} date - Format YYYY-MM-DD
 * @param {string} sessionId - Session ID from fetchCurrentData response
 */
export async function fetchDateData(date, sessionId) {
  const params = new URLSearchParams({ date })
  const response = await fetch(`${BASE_URL}/get_date_data/?${params}`, {
    credentials: 'include',
    headers: {
      'X-Session-Key': sessionId,
    },
  })
  if (!response.ok) {
    throw new Error(`API error ${response.status}`)
  }
  return response.json()
}

/**
 * Fetches distinct days available in DB for the day chart datepicker.
 * @returns {{dates: string[]}} dates in YYYY-MM-DD format
 */
export async function fetchAvailableDates() {
  const response = await fetch(`${BASE_URL}/api/available-dates/`, {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(`API error ${response.status}`)
  }
  return response.json()
}

/**
 * Fetches current weather data for Białystok from the backend cache.
 * Backend calls OpenWeatherMap and caches the result for 10 minutes.
 */
export async function fetchWeather() {
  const response = await fetch(`${BASE_URL}/api/weather/`, {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(`API error ${response.status}`)
  }
  return response.json()
}
