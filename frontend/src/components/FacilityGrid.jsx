import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation } from 'react-router-dom'
import { fetchCurrentData } from '../services/api.js'
import LoadingSpinner from './LoadingSpinner.jsx'

export const POOLS = [
  {
    id: 'small',
    label: 'Pływalnia Kameralna',
    address: 'ul. Mazowiecka 39C',
    city: '15-302 Białystok',
    lastKey: 'lastsmall',
    pctKey: 'small_percent',
    capacity: 30,
    image: '/assets/img/small.jpg',
    mapsUrl: 'https://maps.app.goo.gl/YTTwYV16m3tyxoW76',
    hours: '06:15 – 21:45',
    description: 'Pływalnia Kameralna to przytulny obiekt idealny dla osób szukających spokoju i kameralnej atmosfery podczas treningu.',
  },
  {
    id: 'sport',
    label: 'Pływalnia Sportowa',
    address: 'ul. Włókiennicza 4',
    city: '15-465 Białystok',
    lastKey: 'lastsport',
    pctKey: 'sport_percent',
    capacity: 105,
    image: '/assets/img/sport.jpg',
    mapsUrl: 'https://maps.app.goo.gl/KXXXf2iYu16VJgCz5',
    hours: '06:15 – 21:30',
    description: 'Pływalnia Sportowa BOSiR to nowoczesny kompleks wodny z 25-metrowym basenem sportowym i strefą rekreacyjną.',
  },
  {
    id: 'family',
    label: 'Pływalnia Rodzinna',
    address: 'ul. Stroma 1A',
    city: '15-661 Białystok',
    lastKey: 'lastfamily',
    pctKey: 'family_percent',
    capacity: 150,
    image: '/assets/img/family.jpg',
    mapsUrl: 'https://maps.app.goo.gl/gpSoMPBoRtcT9dw89',
    hours: '06:15 – 21:30',
    description: 'Pływalnia Rodzinna oferuje szeroki wybór atrakcji dla dzieci i dorosłych, w tym zjeżdżalnie i brodziki.',
  },
  {
    id: 'ice',
    label: 'Lodowisko',
    address: 'ul. 11 Listopada 28',
    city: '15-320 Białystok',
    lastKey: 'lastice',
    pctKey: 'ice_percent',
    capacity: 300,
    image: '/assets/img/ice.jpg',
    mapsUrl: 'https://maps.app.goo.gl/WTfr4wwKsGnKtJUQ9',
    hours: 'Zmienny (sprawdź grafik)',
    description: 'Sztuczne lodowisko BOSiR zaprasza na ślizgawki ogólnodostępne w sezonie zimowym.',
    isClosed: true,
  },
]

function getOccupancyColor(percent) {
  if (percent >= 80) return 'text-occupancy-high'
  if (percent >= 50) return 'text-occupancy-medium'
  return 'text-occupancy-low'
}

export default function FacilityGrid({ onSessionId }) {
  const location = useLocation()
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['current'],
    queryFn: fetchCurrentData,
    refetchInterval: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (onSessionId && data?.session_id) onSessionId(data.session_id)
  }, [data, onSessionId])

  if (isLoading) return <LoadingSpinner />

  if (isError) {
    return (
      <div className="bg-error/10 border border-error/20 p-4 rounded-xl text-error text-center" role="alert">
        <p>Błąd ładowania danych: {error.message}</p>
        <button className="mt-2 font-bold underline" onClick={() => refetch()}>Spróbuj ponownie</button>
      </div>
    )
  }

  const isEmpty = !data || !data.lastdate

  if (isEmpty) {
    return (
      <div className="glass-card p-8 text-center text-on-surface-variant">
        <p>Brak danych z bieżącego dnia.</p>
      </div>
    )
  }

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6" aria-label="Kafelki obiektów">
      {POOLS.map((pool) => {
        const { id, label, address, lastKey, pctKey, isClosed } = pool
        const value = data[lastKey]
        const percent = Math.min(data[pctKey] || 0, 100)
        const colorClass = getOccupancyColor(percent)
        
        const actuallyClosed = isClosed || (id === 'ice' && value === 0)

        if (actuallyClosed) {
          return (
            <div key={id} className="glass-card p-4 flex flex-col items-center text-center gap-3 bg-white/30 backdrop-blur-md opacity-80 grayscale-[30%]">
              <div className="flex flex-col items-center">
                <h3 className="text-sm font-semibold text-on-surface line-clamp-1 truncate w-full px-1">{label}</h3>
                <p className="text-[10px] text-outline uppercase font-medium tracking-wider mt-0.5">{address}</p>
              </div>
              <div className="relative w-16 h-16 flex items-center justify-center my-1">
                <svg className="w-full h-full transform -rotate-90 absolute" viewBox="0 0 36 36">
                  <path className="text-surface-variant/50" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="2"></path>
                </svg>
                <div className="flex flex-col items-center z-10">
                  <span className="text-lg font-bold text-outline-variant leading-none">0</span>
                  <span className="text-[10px] font-semibold text-outline-variant leading-tight mt-0.5">ZAMK.</span>
                </div>
              </div>
              <button className="w-full py-2 bg-surface-variant/30 text-outline-variant rounded-xl text-xs font-semibold flex items-center justify-center cursor-not-allowed">
                Zamknięte
              </button>
            </div>
          )
        }

        return (
          <div key={id} className="glass-card p-4 flex flex-col items-center text-center gap-3 bg-gradient-to-b from-white/80 to-white/40 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300 border-t-white/80">
            <div className="flex flex-col items-center">
              <h3 className="text-sm font-semibold text-on-surface line-clamp-1 truncate w-full px-1">{label}</h3>
              <p className="text-[10px] text-outline uppercase font-medium tracking-wider mt-0.5">{address}</p>
            </div>
            <div className="relative w-16 h-16 flex items-center justify-center my-1">
              <svg className="w-full h-full transform -rotate-90 absolute" viewBox="0 0 36 36">
                <path className="text-surface-variant/40" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="2"></path>
                <path 
                  className={`${colorClass} drop-shadow-md transition-all duration-1000 ease-out`} 
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeDasharray={`${percent}, 100`} 
                  strokeLinecap="round" 
                  strokeWidth="2"
                ></path>
              </svg>
              <div className="flex flex-col items-center z-10">
                <span className="text-lg font-bold text-on-surface leading-none tracking-tight">{value}</span>
                <span className={`text-[10px] font-semibold ${colorClass} leading-tight mt-0.5`}>{percent}%</span>
              </div>
            </div>
            {/* 
              Pass background state ONLY on mobile screens to trigger animated overlay.
              On desktop, it will trigger a normal page navigation.
            */}
            <Link 
              to={`/pool/${id}`} 
              state={window.innerWidth < 1024 ? { background: location } : null}
              className="w-full py-2 bg-primary/5 text-primary rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-primary hover:text-white transition-colors duration-200"
            >
              Szczegóły <span className="material-symbols-rounded text-[14px]">arrow_forward</span>
            </Link>
          </div>
        )
      })}
    </section>
  )
}
