import { createContext, useContext, useLayoutEffect, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

function savedPreference() {
  try {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || saved === 'light') return saved
  } catch (_) { /* Storage may be disabled. */ }
  return null
}

function systemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(savedPreference)
  const [system, setSystem] = useState(systemTheme)
  const theme = preference ?? system

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
  }, [theme])

  useEffect(() => {
    if (preference) return
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!media) return
    const update = () => setSystem(media.matches ? 'dark' : 'light')
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [preference])

  useEffect(() => {
    if (!preference) return
    try { localStorage.setItem('theme', preference) } catch (_) { /* Keep the in-memory choice. */ }
  }, [preference])

  function toggleTheme() {
    setPreference((current) => (current ?? system) === 'dark' ? 'light' : 'dark')
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
