import Icon from './Icon.jsx'
import { useQuery } from '@tanstack/react-query'
import { fetchWeather } from '../services/api.js'
import Skeleton from './Skeleton.jsx'

export default function WeatherCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['weather'],
    queryFn: fetchWeather,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
  const isInitialLoading = isLoading && !data

  return (
    <div className="glass-card p-5 flex flex-row md:flex-col items-center justify-between gap-4 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all h-full" aria-busy={isInitialLoading}>
      {isInitialLoading && <span role="status" className="sr-only">Ładowanie pogody</span>}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm border border-primary/5 shrink-0">
          {isInitialLoading ? (
            <Skeleton className="w-8 h-8 !rounded-full" />
          ) : (
             <Icon name={data?.icon ? 'cloud' : 'cloud_off'} size={32} />
          )}
        </div>
        <div>
          <h4 className="font-headline-sm text-[15px] font-semibold text-on-surface">Pogoda</h4>
          <div className="font-body-sm text-[13px] text-on-surface-variant mt-0.5 min-h-5">
            {isInitialLoading ? <Skeleton className="h-5 w-24" /> : (!data ? 'Brak danych' : data.description)}
          </div>
        </div>
      </div>
      <div className="text-right md:text-center mt-2 shrink-0">
        <div className="text-2xl font-bold text-on-surface h-8">
           {isInitialLoading ? <Skeleton className="h-8 w-20 ml-auto md:mx-auto" /> : data?.temp != null ? `${data.temp}°C` : '--°C'}
        </div>
        <div className="text-[11px] font-medium text-outline uppercase tracking-wide mt-1 min-h-[16.5px]">
          {isInitialLoading ? <Skeleton className="h-[16.5px] w-28 ml-auto md:mx-auto" /> : <>
            {data?.feels_like != null ? `Odc: ${data.feels_like}°C` : ''}
            {data?.humidity != null ? ` | Wilg: ${data.humidity}%` : ''}
          </>}
        </div>
        {isError && data && <span role="status" className="block text-xs text-on-surface-variant">Dane nieaktualne</span>}
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
