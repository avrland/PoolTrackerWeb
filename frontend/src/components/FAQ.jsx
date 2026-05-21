export default function FAQ() {
  return (
    <section className="glass-card p-6 flex flex-col gap-4 bg-white/60">
      <h3 className="font-headline-sm text-[16px] font-bold text-on-surface border-b border-surface-variant/40 pb-3">Pytania i odpowiedzi</h3>
      <div className="space-y-5 pt-2">
        <div>
          <h4 className="font-headline-sm text-[14px] font-semibold text-on-surface mb-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span> 
            1. Jak przybliżyć wykres?
          </h4>
          <p className="font-body-sm text-[13px] text-on-surface-variant leading-relaxed pl-3.5">
            Przybliżenie funkcjonuje przez kliknięcie na wykresie i przeciągnięcie. Na urządzeniach mobilnych można przełączyć wykres w tryb pełnoekranowy.
          </p>
        </div>
        <div>
          <h4 className="font-headline-sm text-[14px] font-semibold text-on-surface mb-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span> 
            2. Jak wybrać inny dzień dla danych historycznych?
          </h4>
          <p className="font-body-sm text-[13px] text-on-surface-variant leading-relaxed pl-3.5">
            Domyślnie wyświetlany jest bieżący dzień. Możesz skorzystać z kalendarza lub selektora dni przy wykresach.
          </p>
        </div>
        <div>
          <h4 className="font-headline-sm text-[14px] font-semibold text-on-surface mb-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span> 
            3. Gdzie mogę zgłosić sugestie?
          </h4>
          <p className="font-body-sm text-[13px] text-on-surface-variant leading-relaxed pl-3.5">
            Wszelkie uwagi prosimy kierować poprzez kontakt podany w stopce strony.
          </p>
        </div>
      </div>
    </section>
  )
}
