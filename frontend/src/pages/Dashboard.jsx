import { useState } from 'react'
import FacilityGrid from '../components/FacilityGrid.jsx'
import TodayChart from '../components/TodayChart.jsx'
import HistoricalChart from '../components/HistoricalChart.jsx'
import WeatherCard from '../components/WeatherCard.jsx'
import CountdownCard from '../components/CountdownCard.jsx'
import FacebookCard from '../components/FacebookCard.jsx'
import ErrorBoundary from '../components/ErrorBoundary.jsx'
import HowToUse from '../components/HowToUse.jsx'
import FAQ from '../components/FAQ.jsx'

export default function Dashboard() {
  const [sessionId, setSessionId] = useState(null)

  return (
    <>
      {/* Hero Section: Header + Facility Cards */}
      <section className="flex flex-col gap-6">
        <div className="flex justify-between items-end pb-2 border-b border-surface-variant/50">
          <h2 className="font-headline-lg-mobile md:text-3xl text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-on-surface to-on-surface/70 tracking-tight">
            Stan zajętości obiektów BOSiR
          </h2>
          <div className="flex items-center gap-1.5 bg-error/10 px-2.5 py-1 rounded-full mb-1 border border-error/10">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
            <span className="text-[10px] font-bold text-error uppercase tracking-wider">LIVE</span>
          </div>
        </div>

        <ErrorBoundary>
          <FacilityGrid onSessionId={setSessionId} />
        </ErrorBoundary>
      </section>

      {/* Today Chart Section */}
      <section className="flex flex-col gap-stack-lg">
        <div className="glass-panel p-5 md:p-8 flex flex-col gap-6">
          <ErrorBoundary>
            <TodayChart sessionId={sessionId} />
          </ErrorBoundary>
        </div>
      </section>

      {/* Secondary Info Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-stack-md">
        <ErrorBoundary>
          <WeatherCard />
        </ErrorBoundary>
        <ErrorBoundary>
          <CountdownCard />
        </ErrorBoundary>
        <ErrorBoundary>
          <FacebookCard />
        </ErrorBoundary>
      </section>

      {/* Historical Data Section */}
      <section className="glass-panel p-5 md:p-8 flex flex-col gap-5">
        <div className="flex justify-between items-center border-b border-surface-variant/40 pb-4">
          <span className="font-headline-sm text-[15px] font-semibold text-on-surface">Średnia zajętość obiektów (ostatnie 14 dni)</span>
        </div>
        <ErrorBoundary>
          <HistoricalChart />
        </ErrorBoundary>
      </section>

      {/* How to Use & FAQ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-stack-lg">
        <HowToUse />
        <FAQ />
      </div>
    </>
  )
}
