import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Dashboard from './pages/Dashboard.jsx'
import PoolDetails from './pages/PoolDetails.jsx'
import Layout from './components/Layout.jsx'

export default function App() {
  const location = useLocation()
  
  // The 'background' location is passed from FacilityGrid only on mobile.
  // If it exists, we render the Dashboard as the base and PoolDetails as an overlay.
  const background = location.state?.background

  return (
    <Layout>
      <Routes location={background || location}>
        <Route path="/" element={<Dashboard />} />
        {/* On desktop or direct link, this is the primary route for details */}
        {!background && <Route path="/pool/:id" element={<PoolDetails />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* On mobile, render PoolDetails as an animated overlay if background exists */}
      <AnimatePresence>
        {background && (
          <Routes location={location} key={location.pathname}>
            <Route path="/pool/:id" element={<PoolDetails isModal={true} />} />
          </Routes>
        )}
      </AnimatePresence>
    </Layout>
  )
}
