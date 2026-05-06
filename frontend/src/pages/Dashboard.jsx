import { useState } from 'react'
import CurrentOccupancy from '../components/CurrentOccupancy.jsx'
import HistoricalChart from '../components/HistoricalChart.jsx'
import TodayChart from '../components/TodayChart.jsx'
import WeatherCard from '../components/WeatherCard.jsx'
import FacebookCard from '../components/FacebookCard.jsx'
import CountdownCard from '../components/CountdownCard.jsx'
import DarkModeToggle from '../components/DarkModeToggle.jsx'
import ChatbotWidget from '../components/ChatbotWidget.jsx'
import ErrorBoundary from '../components/ErrorBoundary.jsx'

export default function Dashboard() {
  const [sessionId, setSessionId] = useState(null)

  return (
    <>
      <div className="dashboard">
        <header className="dashboard__header">
          <h1>PoolTracker — Basen Białystok</h1>
          <DarkModeToggle />
        </header>

        <h2 className="section-heading">Aktualne obłożenie</h2>
        <ErrorBoundary>
          <CurrentOccupancy onSessionId={setSessionId} />
        </ErrorBoundary>

        <div className="extra-cards">
          <ErrorBoundary>
            <WeatherCard />
          </ErrorBoundary>
          <ErrorBoundary>
            <CountdownCard />
          </ErrorBoundary>
          <FacebookCard />
        </div>

        <h2 className="section-heading" style={{ marginTop: '1rem' }}>
          Wykres dnia
        </h2>
        <ErrorBoundary>
          <TodayChart />
        </ErrorBoundary>

        <h2 className="section-heading" style={{ marginTop: '1.5rem' }}>
          Statystyki historyczne
        </h2>
        <ErrorBoundary>
          <HistoricalChart />
        </ErrorBoundary>
      </div>

      <ChatbotWidget sessionId={sessionId} />
    </>
  )
}
