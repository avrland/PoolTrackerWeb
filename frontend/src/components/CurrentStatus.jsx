import useCurrentData from '../hooks/useCurrentData.js'

export default function CurrentStatus({ showTotal = false, className = '' }) {
  const { data, status, hasCurrentData } = useCurrentData()
  const total = hasCurrentData
    ? ['lastsport', 'lastfamily', 'lastsmall', 'lastice'].reduce((sum, key) => sum + (data[key] ?? 0), 0)
    : null
  const label = status === 'loading' ? 'Ładowanie danych'
    : status === 'unavailable' ? 'Dane niedostępne'
    : status === 'stale' ? (showTotal ? `Ostatnio: ${total} osób · Dane nieaktualne` : 'Dane nieaktualne')
    : showTotal ? `Teraz pływa łącznie ${total} osób` : 'LIVE'

  return (
    <div
      role="status"
      className={`items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${status === 'live' ? 'bg-error/10 border-error/10 text-error' : 'bg-surface-container border-outline-variant/30 text-on-surface-variant'} ${className}`}
    >
      <span aria-hidden="true" className={`w-2 h-2 rounded-full shrink-0 ${status === 'live' ? 'bg-error motion-safe:animate-pulse' : 'bg-outline'}`} />
      <span>{label}</span>
    </div>
  )
}
