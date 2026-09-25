import Icon from './Icon.jsx'
export default function HowToUse() {
  return (
    <section className="glass-card p-5 bg-white/40 hidden md:block">
      <div className="flex items-center justify-between mb-4 border-b border-outline-variant/20 pb-3">
        <div className="flex items-center gap-2 text-primary">
          <Icon name="info" variant="rounded" size={22} />
          <h3 className="font-headline-sm text-[15px] font-semibold text-on-surface">Jak korzystać z serwisu</h3>
        </div>
        <button aria-label="Zamknij instrukcję" className="text-outline hover:text-on-surface bg-white/50 hover:bg-white p-1 rounded-full transition-all">
          <Icon name="close" variant="rounded" size={20} />
        </button>
      </div>
      <ul className="flex flex-col gap-3 font-body-sm text-[13px] text-on-surface-variant">
        <li className="flex items-start gap-3">
          <Icon name="location_on" variant="rounded" size={18} className="text-primary/60 mt-0.5" />
          Kliknij "Szczegóły" w kafelkach powyżej, aby sprawdzić godziny otwarcia i adres.
        </li>
        <li className="flex items-start gap-3">
          <Icon name="touch_app" variant="rounded" size={18} className="text-primary/60 mt-0.5" />
          Dotknij lub najedź na linię wykresu, aby zobaczyć dokładną godzinę i liczbę osób.
        </li>
        <li className="flex items-start gap-3">
          <Icon name="visibility" variant="rounded" size={18} className="text-primary/60 mt-0.5" />
          Kliknij nazwę obiektu w legendzie, aby ukryć lub wyświetlić jego dane.
        </li>
        <li className="flex items-start gap-3">
          <Icon name="calendar_month" variant="rounded" size={18} className="text-primary/60 mt-0.5" />
          Wybierz inną datę w kalendarzu, żeby porównać frekwencję z poprzednich dni.
        </li>
      </ul>
      <p className="text-right mt-4 font-label-caps text-[10px] text-outline-variant tracking-wider">
        System monitoringu basenów BOSiR Białystok
      </p>
    </section>
  )
}
