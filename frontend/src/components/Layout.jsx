import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchCurrentData } from '../services/api.js'

export default function Layout({ children }) {
  const { data } = useQuery({
    queryKey: ['current'],
    queryFn: fetchCurrentData,
    refetchInterval: 5 * 60 * 1000,
  })

  const totalPeople = data ? (
    (data.lastsport || 0) + 
    (data.lastfamily || 0) + 
    (data.lastsmall || 0) + 
    (data.lastice || 0)
  ) : 0

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
              src="https://lh3.googleusercontent.com/aida/ADBb0ugiAWVCxatAHTqQ3Qdaq7o885ZCEtRGTwrVYDV3u7OeesuA3kFrCpWGENaxy9xD_Bko89CCtQyTkQOWka08NQm-SyCZjgQ0jpEaEBqHSP9yFUf7b51rHN8MEjVliuS_Ol5_f53lDPkHFApIpfTwAqsbi8GjxYjl_QyogIpDC25xVbUH20Y75VtQCULNa166H0yI4I0LiNDAkcvN7PcQ7GkAI8QdHEeZ8yTsmZqKPlJMVcj2XmifOClkyFE"
            />
            <h1 className="font-headline-md text-lg font-bold text-primary tracking-tight">
              basen.bialystok.pl
            </h1>
          </Link>

          <div className="hidden sm:flex items-center gap-2 bg-error/10 px-3 py-1 rounded-full ml-3 border border-error/10 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse shadow-[0_0_8px_rgba(186,26,26,0.6)]"></span>
            <span className="text-[10px] font-bold text-error uppercase tracking-wider">
              Teraz pływa łącznie {totalPeople} osób
            </span>
          </div>

          <button className="p-2 hover:bg-surface-container-low transition-colors rounded-full active:scale-95 duration-150">
            <span className="material-symbols-rounded text-primary">menu</span>
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
              src="https://lh3.googleusercontent.com/aida/ADBb0ug3LLuK9wrfEEqHuqmPz5lKRN6QD4xhuLNX0uougXEv-wRfMWmIeXd8Xb5CSbYUE8u5ILU2PpZjCjGagJjg8Dx6zspxb9_liNpD8p9EinWJS3JzumpIbGIv45tp3j7LvUPdpAQrb_05-KWmsQYRO31mNZ1gLHkYmnFhX7Oq-AsdJ6YBR7qo5kJTrn7q6brjpVKCEtw-X6NSWt0l10rb6a4A5XofEM0dPnlcNNsjfbBlTKB27Wu7yP7nxSk"
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
