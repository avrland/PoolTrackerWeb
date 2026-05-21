import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { fetchCurrentData } from '../services/api.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { POOLS } from '../components/FacilityGrid.jsx'

export default function PoolDetails({ isModal = false }) {
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
        <Link to="/" className="text-primary hover:underline font-bold">Wróć do strony głównej</Link>
      </div>
    )
  }

  if (isLoading) return <div className="flex justify-center p-20"><LoadingSpinner /></div>

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 text-center">
        <h2 className="text-xl font-bold text-error">Błąd ładowania danych</h2>
        <button onClick={() => navigate('/')} className="text-primary underline font-bold">Wróć</button>
      </div>
    )
  }

  const value = data?.[pool.lastKey] ?? 0
  const percent = Math.min(data?.[pool.pctKey] ?? 0, 100)

  const handleClose = () => navigate('/')

  const Content = ({ mobile = false }) => (
    <div className="flex flex-col">
       {/* Hero Image Section */}
       <div className={`relative ${mobile ? 'h-56' : 'h-[400px]'} shrink-0 overflow-hidden ${!mobile && 'rounded-xl border border-outline-variant bg-surface-container-lowest'}`}>
          <img alt={pool.label} className="w-full h-full object-cover" src={pool.image} />
          {mobile && (
             <button 
                aria-label="Zamknij" 
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-surface-container-lowest/80 backdrop-blur-md rounded-full text-on-surface z-[100] shadow-md"
                onClick={handleClose}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
          )}
        </div>

        {/* Content Body Section */}
        <div className={`flex flex-col gap-stack-lg ${mobile ? 'px-margin-mobile py-stack-md' : 'mt-stack-lg'}`}>
          {!mobile && (
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant mb-2">
              <Link to="/" className="hover:text-primary transition-colors">Strona główna</Link>
              <span className="text-outline-variant">/</span>
              <span className="text-primary font-medium underline underline-offset-4 decoration-1 decoration-primary/30">{pool.label}</span>
            </nav>
          )}

          <div className="flex flex-col gap-stack-sm">
            {!mobile && (
               <button 
                className="flex items-center gap-2 text-primary hover:bg-surface-container-low px-2 py-1 -ml-2 rounded-lg transition-colors w-fit mb-1 font-bold" 
                onClick={handleClose}
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                <span>Wstecz</span>
              </button>
            )}

            <h2 className={`${mobile ? 'font-headline-lg-mobile text-headline-lg-mobile' : 'font-headline-lg text-headline-lg'} text-on-surface`}>{pool.label}</h2>
            
            <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-occupancy-low icon-fill" style={{ fontSize: '16px' }}>fiber_manual_record</span>
              <span>Obiekt otwarty</span>
              <span className="mx-1 text-outline-variant">•</span>
              <span>{pool.address}</span>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mt-2">
              {pool.description}
            </p>
          </div>

          {/* Occupancy Card for Mobile */}
          {mobile && (
             <div className="bg-surface p-stack-md border border-outline-variant rounded-xl flex flex-col gap-stack-sm shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Obłożenie</span>
                  <span className={`font-headline-sm text-headline-sm font-bold ${percent >= 80 ? 'text-occupancy-high' : percent >= 50 ? 'text-occupancy-medium' : 'text-occupancy-low'}`}>
                    {percent}%
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-data-display text-data-display text-on-surface">{value}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">/ {pool.capacity} osób</span>
                </div>
                <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden mt-1">
                  <div className={`h-full transition-all duration-1000 ease-out ${percent >= 80 ? 'bg-occupancy-high' : percent >= 50 ? 'bg-occupancy-medium' : 'bg-occupancy-low'}`} style={{ width: `${percent}%` }}></div>
                </div>
              </div>
          )}

          {/* Opening Hours Row */}
          <div className="flex items-start gap-3 pb-4">
            <span className="material-symbols-outlined text-primary mt-0.5">schedule</span>
            <div className="flex flex-col">
              <span className="font-headline-sm text-on-surface font-semibold">Godziny otwarcia</span>
              <span className="font-body-md text-body-md text-on-surface-variant">Poniedziałek - Niedziela</span>
              <span className="font-body-lg text-body-lg text-on-surface font-bold mt-1">{pool.hours}</span>
            </div>
          </div>

          {/* Gallery placeholder for Desktop */}
          {!mobile && (
            <div className="grid grid-cols-2 gap-4">
              <img className="w-full h-48 object-cover rounded-lg border border-outline-variant" src={pool.image} alt="Gallery 1" />
              <div className="bg-surface-container-high w-full h-48 rounded-lg flex items-center justify-center text-outline-variant">
                 <span className="material-symbols-outlined text-4xl">image</span>
              </div>
            </div>
          )}
        </div>
    </div>
  )

  // Full Page View (Desktop or direct Mobile link)
  if (!isModal) {
    return (
      <div className="flex flex-col gap-stack-lg lg:flex-row pb-10">
        <section className="w-full lg:w-[60%] flex flex-col gap-stack-lg">
          <Content mobile={false} />
        </section>

        <aside className="w-full lg:w-[40%] flex flex-col gap-stack-md lg:sticky lg:top-24 h-fit lg:pt-[104px]">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-md shadow-md">
            <div className="flex justify-between items-center">
              <span className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2 font-semibold">
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
            <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden mt-2">
              <div className={`h-full transition-all duration-1000 ease-out ${percent >= 80 ? 'bg-occupancy-high' : 'bg-primary'}`} style={{ width: `${percent}%` }}></div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant text-right">Dane na żywo</p>
          </div>

          <div className="flex flex-col gap-stack-sm mt-4">
            <a href={pool.mapsUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-primary text-on-primary font-headline-sm text-headline-sm py-3 px-6 rounded-full flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-md font-bold">
              <span className="material-symbols-outlined icon-fill">navigation</span>
              Nawiguj w Google Maps
            </a>
          </div>
        </aside>
      </div>
    )
  }

  // Modal View (Mobile slide-up)
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm pointer-events-auto"
      />

      {/* Animated Bottom Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={(_, info) => {
          // Close if dragged down more than 100px OR swiped down fast (velocity > 500)
          if (info.offset.y > 100 || info.velocity.y > 500) {
            handleClose()
          }
        }}
        className="bg-surface-container-lowest w-full h-[92vh] rounded-t-3xl overflow-hidden flex flex-col shadow-2xl relative z-[110] pointer-events-auto"
      >
        {/* Handle */}
        <div className="h-10 w-full flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-surface-container-highest/60 rounded-full"></div>
        </div>

        <div className="flex-1 overflow-y-auto pt-2">
           <Content mobile={true} />
        </div>

        {/* Footer */}
        <div className="p-margin-mobile bg-surface-container-lowest border-t border-outline-variant shrink-0 flex flex-col gap-stack-sm z-20 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
          <button 
            className="w-full bg-primary text-on-primary font-headline-sm text-headline-sm py-3.5 px-6 rounded-full flex items-center justify-center shadow-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all"
            onClick={handleClose}
          >
            Zamknij
          </button>
          <a 
            href={pool.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full border-2 border-primary text-primary font-headline-sm text-headline-sm py-3 px-6 rounded-full flex items-center justify-center gap-2 font-bold active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined icon-fill text-[20px]">directions</span>
            Nawiguj w Google Maps
          </a>
        </div>
      </motion.div>
    </div>
  )
}
