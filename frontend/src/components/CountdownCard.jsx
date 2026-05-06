import { useQuery } from '@tanstack/react-query'
import { fetchCurrentData } from '../services/api.js'
import LoadingSpinner from './LoadingSpinner.jsx'

export default function CountdownCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['current'],
    queryFn: fetchCurrentData,
    refetchInterval: 5 * 60 * 1000,
  })

  if (isLoading) return <div className="weather-card"><LoadingSpinner /></div>

  if (isError || !data) return null

  const opening = data.opening

  return (
    <article className="weather-card" aria-label="Odliczanie do otwarcia aquaparku">
      <div className="weather-card__title">Aquapark</div>
      {opening > 0 ? (
        <>
          <div className="weather-card__temp" style={{ fontSize: '2rem' }}>
            {opening}
          </div>
          <div className="weather-card__desc">dni do otwarcia</div>
        </>
      ) : (
        <div className="weather-card__desc" style={{ marginTop: '0.75rem' }}>
          Aquapark jest już otwarty! 🎉
        </div>
      )}
    </article>
  )
}
