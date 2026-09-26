import { useTheme } from '../contexts/ThemeContext.jsx'

export default function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme()
  const label = theme === 'dark' ? 'Przełącz na tryb jasny' : 'Przełącz na tryb ciemny'

  return (
    <button type="button" onClick={toggleTheme} aria-label={label} title={label}
      className="w-11 h-11 shrink-0 flex items-center justify-center text-primary hover:bg-surface-container-low rounded-full transition-colors active:scale-95">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        {theme === 'dark' ? <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
        </> : <path d="M20.9 13.1A9 9 0 0 1 10.9 3.1 9 9 0 1 0 20.9 13.1Z" />}
      </svg>
    </button>
  )
}
