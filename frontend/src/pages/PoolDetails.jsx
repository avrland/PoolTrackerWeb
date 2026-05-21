import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchCurrentData } from '../services/api.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { POOLS } from '../components/FacilityGrid.jsx'

export default function PoolDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const pool = POOLS.find((p) => p.id === id)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['current'],
    queryFn: fetchCurrentData,
  })

  if (!pool) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <h2 className="text-2xl font-bold">Obiekt nie został znaleziony</h2>
        <Link to="/" className="text-primary hover:underline">Wróć do strony głównej</Link>
      </div>
    )
  }

  if (isLoading) return <div className="flex justify-center p-20"><LoadingSpinner /></div>

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <h2 className="text-xl font-bold text-error">Błąd ładowania danych</h2>
        <button onClick={() => navigate('/')} className="text-primary underline">Wróć</button>
      </div>
    )
  }

  const value = data?.[pool.lastKey] ?? 0
  const percent = Math.min(data?.[pool.pctKey] ?? 0, 100)

  const handleClose = () => navigate('/')

  return (
    <div className="relative">
      {/* Mobile-style View (matches pool_details_mobile rework precisely) */}
      {/* Using fixed positioning on mobile to simulate the modal look without framer-motion complexity */}
      <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center bg-inverse-surface/40 backdrop-blur-sm">
        <div className="bg-surface-container-lowest w-full h-[95vh] rounded-t-xl overflow-hidden flex flex-col shadow-2xl relative">
          {/* Handle */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-surface-container-highest/60 rounded-full z-[60]"></div>
          
          {/* Hero Image Header */}
          <div className="relative h-56 shrink-0">
            <img 
              alt={pool.label} 
              className="w-full h-full object-cover" 
              src={pool.image} 
            />
            {/* Close Button (Absolute on Image) */}
            <button 
              aria-label="Zamknij" 
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-surface-container-lowest/80 backdrop-blur-md rounded-full text-on-surface hover:bg-surface-container-highest transition-colors z-[70]"
              onClick={handleClose}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Modal Content Body */}
          <div className="flex-1 overflow-y-auto px-margin-mobile py-stack-md flex flex-col gap-stack-lg">
            {/* Header Info */}
            <div className="flex flex-col gap-stack-sm">
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{pool.label}</h2>
              <div className="flex items-start gap-2 text-on-surface-variant font-body-sm text-body-sm">
                <span className="material-symbols-outlined text-[18px] mt-0.5">location_on</span>
                <span>{pool.address}, {pool.city}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {pool.description}
              </p>
            </div>

            {/* Capacity Status */}
            <div className="bg-surface p-stack-md border border-outline-variant rounded-lg flex flex-col gap-stack-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Zapełnienie obiektu</span>
                <span className={`font-headline-sm text-headline-sm font-bold ${percent >= 80 ? 'text-occupancy-high' : percent >= 50 ? 'text-occupancy-medium' : 'text-occupancy-low'}`}>
                  {percent}% zajęte
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-data-display text-data-display text-on-surface">{value}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">/ {pool.capacity} osób</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden mt-1">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${percent >= 80 ? 'bg-occupancy-high' : percent >= 50 ? 'bg-occupancy-medium' : 'bg-occupancy-low'}`} 
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
            </div>

            {/* Opening Hours */}
            <div className="flex items-start gap-3 pb-4">
              <span className="material-symbols-outlined text-outline mt-0.5">schedule</span>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-surface mb-1 font-semibold">Godziny otwarcia</span>
                <span className="font-body-md text-body-md text-on-surface-variant">Poniedziałek - Niedziela</span>
                <span className="font-body-lg text-body-lg text-on-surface font-bold mt-1">{pool.hours}</span>
              </div>
            </div>
          </div>

          {/* Sticky Action Footer */}
          <div className="p-margin-mobile bg-surface-container-lowest border-t border-outline-variant shrink-0 flex flex-col gap-stack-sm shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
            <button 
              className="w-full bg-primary text-on-primary font-headline-sm text-headline-sm py-3 px-6 rounded-full hover:bg-on-primary-fixed-variant transition-colors flex items-center justify-center shadow-sm font-bold"
              onClick={handleClose}
            >
              Zamknij
            </button>
            <a 
              href={pool.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full border-2 border-primary text-primary font-headline-sm text-headline-sm py-3 px-6 rounded-full hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 font-bold"
            >
              <span className="material-symbols-outlined icon-fill text-[20px]">directions</span>
              Nawiguj w Google Maps
            </a>
          </div>
        </div>
      </div>

      {/* Desktop Layout (Standard Full Page) */}
      <div className="hidden lg:flex flex-col gap-stack-lg lg:flex-row pb-10">
        {/* Left Column: Details & Content (60%) */}
        <section className="w-full lg:w-[60%] flex flex-col gap-stack-lg">
          {/* Hero Image */}
          <div className="w-full rounded-xl overflow-hidden border border-outline-variant bg-surface-container-lowest">
            <img 
              alt={pool.label} 
              className="w-full h-[400px] object-cover" 
              src={pool.image} 
            />
          </div>

          {/* Facility Title & Description */}
          <div className="flex flex-col gap-stack-sm">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant mb-2">
              <Link to="/" className="hover:text-primary transition-colors">Strona główna</Link>
              <span className="text-outline-variant">/</span>
              <span className="text-primary font-medium underline underline-offset-4 decoration-1 decoration-primary/30">{pool.label}</span>
            </nav>

            <button 
              className="flex items-center gap-2 text-primary hover:bg-surface-container-low px-2 py-1 -ml-2 rounded-lg transition-colors w-fit mb-1" 
              onClick={handleClose}
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              <span className="font-body-md font-medium">Wstecz</span>
            </button>

            <h2 className="font-headline-lg text-headline-lg text-on-surface">{pool.label}</h2>
            
            <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-occupancy-low icon-fill" style={{ fontSize: '16px' }}>fiber_manual_record</span>
              <span className="">Obiekt otwarty</span>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant mt-stack-sm leading-relaxed">
              {pool.description}
            </p>
          </div>

          {/* Gallery Placeholder */}
          <div className="grid grid-cols-2 gap-4">
            <img 
              className="w-full h-48 object-cover rounded-lg border border-outline-variant hover:opacity-90 transition-opacity cursor-pointer" 
              src={pool.image}
              alt="Gallery 1"
            />
            <div className="bg-surface-container-high w-full h-48 rounded-lg flex items-center justify-center text-outline-variant">
               <span className="material-symbols-outlined text-4xl">image</span>
            </div>
          </div>
        </section>

        {/* Right Column: Sticky Sidebar Data (40%) */}
        <aside className="w-full lg:w-[40%] flex flex-col gap-stack-md lg:sticky lg:top-24 h-fit">
          {/* Live Occupancy Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-md shadow-sm">
            <div className="flex justify-between items-center">
              <span className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary font-bold">groups</span>
                Aktualne obłożenie
              </span>
              <span className={`bg-surface-container bg-opacity-50 font-label-caps text-label-caps px-3 py-1 rounded-full border border-outline-variant uppercase font-bold ${percent >= 80 ? 'text-occupancy-high border-occupancy-high/30' : 'text-on-surface-variant'}`}>
                {percent}% PEŁNY
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-data-display text-data-display text-primary">{value}</span>
              <span className="font-body-lg text-body-lg text-on-surface-variant">/ {pool.capacity} osób</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden mt-2">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${percent >= 80 ? 'bg-occupancy-high' : 'bg-primary'}`} 
                style={{ width: `${percent}%` }}
              ></div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant text-right">Odświeżono przed chwilą</p>
          </div>

          {/* Quick Info Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-sm">
            {/* Hours */}
            <div className="flex items-start gap-3 py-2 border-b border-outline-variant border-opacity-50">
              <span className="material-symbols-outlined text-primary mt-0.5">schedule</span>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">{pool.hours}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Godziny otwarcia</span>
              </div>
            </div>
            {/* Address */}
            <div className="flex items-start gap-3 py-2">
              <span className="material-symbols-outlined text-primary mt-0.5">location_on</span>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">{pool.address}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">{pool.city}</span>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className="flex flex-col gap-stack-sm mt-2">
            <a 
              href={pool.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-primary text-on-primary font-headline-sm text-headline-sm py-3 px-6 rounded-full flex items-center justify-center gap-2 hover:bg-on-primary-fixed-variant transition-colors shadow-sm font-bold"
            >
              <span className="material-symbols-outlined icon-fill">navigation</span>
              Nawiguj w Google Maps
            </a>
          </div>
        </aside>
      </div>
    </div>
  )
}
