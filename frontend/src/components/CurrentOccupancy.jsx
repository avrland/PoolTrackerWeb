import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCurrentData } from '../services/api.js'
import LoadingSpinner from './LoadingSpinner.jsx'
import PoolModal from './PoolModal.jsx'

const POOLS = [
  {
    key: 'sport',
    label: 'Basen Sportowy',
    icon: '🏊',
    lastKey: 'lastsport',
    pctKey: 'sport_percent',
    capacity: 105,
    address: 'Włókiennicza 4, 15-465 Białystok',
    mapsUrl: 'https://maps.app.goo.gl/KXXXf2iYu16VJgCz5',
    hours: {
      'Poniedziałek': '06:15–21:30',
      'Wtorek':       '06:15–21:30',
      'Środa':        '06:15–21:30',
      'Czwartek':     '07:00–21:30',
      'Piątek':       '06:15–21:30',
      'Sobota':       '06:15–21:30',
      'Niedziela':    '06:15–21:30',
    },
  },
  {
    key: 'family',
    label: 'Basen Rodzinny',
    icon: '🏊',
    lastKey: 'lastfamily',
    pctKey: 'family_percent',
    capacity: 150,
    address: 'Stroma 1A, 15-661 Białystok',
    mapsUrl: 'https://maps.app.goo.gl/gpSoMPBoRtcT9dw89',
    hours: {
      'Poniedziałek': '06:15–21:30',
      'Wtorek':       '06:15–21:30',
      'Środa':        '06:15–21:30',
      'Czwartek':     '07:00–21:30',
      'Piątek':       '06:15–21:30',
      'Sobota':       '06:15–21:30',
      'Niedziela':    '06:15–21:30',
    },
  },
  {
    key: 'small',
    label: 'Basen Kameralny',
    icon: '🏊',
    lastKey: 'lastsmall',
    pctKey: 'small_percent',
    capacity: 30,
    address: 'Mazowiecka 39C, 15-302 Białystok',
    mapsUrl: 'https://maps.app.goo.gl/YTTwYV16m3tyxoW76',
    hours: {
      'Poniedziałek': '06:15–21:45',
      'Wtorek':       '06:15–21:45',
      'Środa':        '07:00–21:45',
      'Czwartek':     '06:15–21:45',
      'Piątek':       '06:15–21:45',
      'Sobota':       '06:15–21:45',
      'Niedziela':    '06:15–21:45',
    },
  },
  {
    key: 'ice',
    label: 'Lodowisko',
    icon: '⛸️',
    lastKey: 'lastice',
    pctKey: 'ice_percent',
    capacity: 300,
    address: '11 Listopada 28, 15-320 Białystok',
    mapsUrl: 'https://maps.app.goo.gl/WTfr4wwKsGnKtJUQ9',
    hours: {
      'Poniedziałek': '17:00–18:30, 19:00–21:00',
      'Wtorek':       '17:00–18:30, 19:00–20:30',
      'Środa':        '17:00–18:30, 19:00–20:30',
      'Czwartek':     '17:00–18:30, 19:00–21:00',
      'Piątek':       '17:00–18:30, 19:00–20:30',
      'Sobota':       '11:30–21:00',
      'Niedziela':    '11:30–21:00',
    },
  },
]

function getBarClass(percent) {
  if (percent >= 80) return 'progress-bar progress-bar--danger'
  if (percent >= 55) return 'progress-bar progress-bar--warning'
  return 'progress-bar'
}

export default function CurrentOccupancy({ onSessionId }) {
  const [openModal, setOpenModal] = useState(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['current'],
    queryFn: fetchCurrentData,
    refetchInterval: 5 * 60 * 1000, // refresh every 5 minutes
    onSuccess: (d) => {
      if (onSessionId && d.session_id) onSessionId(d.session_id)
    },
  })

  if (isLoading) return <LoadingSpinner />

  if (isError) {
    return (
      <div className="error-message" role="alert">
        <p>Błąd ładowania danych: {error.message}</p>
        <button onClick={() => refetch()}>Spróbuj ponownie</button>
      </div>
    )
  }

  const isEmpty = !data || data.date.length === 0

  return (
    <section aria-label="Bieżące obłożenie basenów">
      {isEmpty ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#6c757d' }}>
          <p>Brak danych z bieżącego dnia.</p>
        </div>
      ) : (
        <>
          <p className="last-update" style={{ padding: '0 1rem' }}>
            Ostatni pomiar: <strong>{data.lastdate}</strong>
          </p>
          <div className="pool-grid">
            {POOLS.map((pool) => {
              const { key, label, lastKey, pctKey, capacity, address, mapsUrl, hours } = pool
              const value = data[lastKey]
              const percent = Math.min(data[pctKey], 100)
              return (
                <article key={key} className="pool-card">
                  <div className="pool-card__name">{label}</div>
                  <button
                    className="pool-card__icon-btn"
                    onClick={() => setOpenModal(key)}
                    aria-label={`Godziny otwarcia: ${label}`}
                    title="Sprawdź godziny otwarcia"
                  >
                    <span className="pool-card__icon" aria-hidden="true">{pool.icon}</span>
                  </button>
                  <div className="pool-card__value">
                    {value}
                    <span className="pool-card__unit"> / {capacity}</span>
                  </div>
                  <div
                    className="progress-bar-container"
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${label}: ${percent}% obłożenia`}
                  >
                    <div
                      className={getBarClass(percent)}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>
                    {percent}% obłożenia
                  </div>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pool-card__address"
                  >
                    {address}
                  </a>
                </article>
              )
            })}
          </div>
          {openModal && (() => {
            const pool = POOLS.find(p => p.key === openModal)
            return pool ? (
              <PoolModal
                isOpen={true}
                onClose={() => setOpenModal(null)}
                title={pool.label}
                hours={pool.hours}
              />
            ) : null
          })()}
        </>
      )}
    </section>
  )
}
