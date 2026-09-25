import Icon from './Icon.jsx'
import { Link } from 'react-router-dom'
import CurrentStatus from './CurrentStatus.jsx'

export default function Layout({ children }) {
  return (
    <div className="text-on-surface font-body-md min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Background Overlay */}
      <div className="fixed inset-0 z-[-1] bg-hero-pattern opacity-30"></div>
      <div className="fixed inset-0 z-[-1] bg-gradient-to-b from-white/40 via-background/90 to-background"></div>

      {/* Top App Bar */}
      <header className="bg-white/70 backdrop-blur-lg border-b border-white/50 shadow-[0_2px_10px_rgba(0,0,0,0.02)] fixed top-0 w-full z-50 transition-all">
        <div className="flex items-center justify-between h-16 px-4 md:px-6 w-full max-w-container-max mx-auto">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img
              alt="Logo"
              className="w-8 h-8 rounded-lg shrink-0 shadow-sm"
              src="/assets/img/logo.png"
            />
            <h1 className="font-headline-md text-lg font-bold text-primary tracking-tight">
              basen.bialystok.pl<sup className="ml-1 text-[10px] font-medium tracking-normal">beta</sup>
            </h1>
          </Link>

          <CurrentStatus showTotal className="hidden sm:flex ml-3 shadow-sm" />

          <button aria-label="Menu" className="p-2 hover:bg-surface-container-low transition-colors rounded-full active:scale-95 duration-150">
            <Icon name="menu" variant="rounded" size={24} className="text-primary" />
          </button>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="flex-1 w-full max-w-container-max mx-auto px-margin-mobile pt-[104px] pb-stack-xl flex flex-col gap-stack-xl">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-white/60 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] w-full mt-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 py-8 px-6 w-full max-w-container-max mx-auto">
          <div className="flex items-center gap-3">
            <img
              alt="BOSiR Logo"
              className="w-8 h-8 rounded-lg shadow-sm"
              src="/assets/img/logo.png"
            />
            <h2 className="font-headline-sm text-[15px] font-bold text-primary tracking-tight">
              basen.bialystok.pl
            </h2>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3">
            <a className="text-[12px] font-medium text-outline hover:text-primary transition-colors tracking-wide" href="#">
              Polityka Prywatności
            </a>
            <a className="text-[12px] font-medium text-outline hover:text-primary transition-colors tracking-wide" href="#">
              Kontakt
            </a>
          </nav>
          <p className="text-[11px] text-outline-variant text-center md:text-right font-medium tracking-wide">
            © 2026 basen.bialystok.pl
          </p>
        </div>
      </footer>
    </div>
  )
}
