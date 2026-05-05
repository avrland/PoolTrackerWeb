import { useQuery } from '@tanstack/react-query'
import { fetchWeather } from '../services/api.js'
import LoadingSpinner from './LoadingSpinner.jsx'

export default function WeatherCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['weather'],
    queryFn: fetchWeather,
    staleTime: 10 * 60 * 1000, // 10 minutes — matches backend cache TTL
    retry: 1,
  })

  if (isLoading) return <div className="weather-card"><LoadingSpinner /></div>

  if (isError || !data || data.error) {
    return (
      <article className="weather-card" aria-label="Pogoda Białystok">
        <div className="weather-card__title">Pogoda</div>
        <div style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Brak danych pogodowych
        </div>
      </article>
    )
  }

  return (
    <article className="weather-card" aria-label={`Pogoda w Białymstoku: ${data.description}`}>
      <div className="weather-card__title">Pogoda | Białystok</div>
      <img
        className="weather-card__icon"
        src={`https://openweathermap.org/img/wn/${data.icon}@2x.png`}
        alt={data.description}
        width="64"
        height="64"
      />
      <div className="weather-card__temp">{data.temp}°C</div>
      <div className="weather-card__desc">{data.description}</div>
      <div className="weather-card__details">
        Odczuwalna: {data.feels_like}°C &nbsp;|&nbsp; Wilgotność: {data.humidity}%
      </div>
    </article>
  )
}
