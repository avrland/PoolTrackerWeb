export default function FacebookCard() {
  return (
    <div className="glass-card p-5 flex flex-row md:flex-col items-center justify-between gap-4 bg-gradient-to-br from-white/80 to-primary-fixed/20 border-primary/10 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all h-full">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#1877F2] flex items-center justify-center text-white shadow-sm shrink-0">
           <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
           </svg>
        </div>
        <div>
          <h4 className="font-headline-sm text-[15px] font-semibold text-on-surface">Bądź na bieżąco</h4>
          <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">Śledź nasze nowości</p>
        </div>
      </div>
      <a 
        className="px-5 py-2.5 bg-[#1877F2] text-white text-[13px] rounded-xl hover:bg-[#0c62d4] shadow-sm transition-colors font-semibold text-center w-full md:w-auto mt-2" 
        href="https://www.facebook.com/basenbialystok/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Polub nas na FB
      </a>
    </div>
  )
}
