import { useQuery } from '@tanstack/react-query'
import { fetchWeather } from '../services/api.js'

export default function WeatherCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['weather'],
    queryFn: fetchWeather,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })

  return (
    <div className="glass-card p-5 flex flex-row md:flex-col items-center justify-between gap-4 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all h-full">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm border border-primary/5 shrink-0">
          {isLoading ? (
            <span className="animate-spin material-symbols-rounded">sync</span>
          ) : (
             <span className="material-symbols-rounded text-[32px] font-light">
               {data?.icon ? 'cloud' : 'cloud_off'}
             </span>
          )}
        </div>
        <div>
          <h4 className="font-headline-sm text-[15px] font-semibold text-on-surface">Pogoda</h4>
          <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">
            {isLoading ? 'Ładowanie...' : (isError || !data ? 'Brak danych' : data.description)}
          </p>
        </div>
      </div>
      <div className="text-right md:text-center mt-2 shrink-0">
        <div className="text-2xl font-bold text-on-surface">
           {data?.temp ? `${data.temp}°C` : '--°C'}
        </div>
        <p className="text-[11px] font-medium text-outline uppercase tracking-wide mt-1">
          {data?.feels_like ? `Odc: ${data.feels_like}°C` : ''} 
          {data?.humidity ? ` | Wilg: ${data.humidity}%` : ''}
        </p>
        <a 
          className="text-[12px] font-semibold text-primary hover:text-primary-container transition-colors mt-2 inline-block bg-primary/5 px-3 py-1 rounded-full" 
          href="https://www.google.com/maps?q=Białystok"
          target="_blank"
          rel="noopener noreferrer"
        >
          Białystok
        </a>
      </div>
    </div>
  )
}
