import { useState, useEffect } from 'react'

const TARGET = new Date('2028-12-15T00:00:00')

export default function CountdownCard() {
  const [countdown, setCountdown] = useState(null)

  useEffect(() => {
    function tick() {
      const distance = TARGET - new Date()
      if (distance <= 0) {
        setCountdown(null)
        return
      }
      setCountdown({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="glass-card p-5 flex flex-row md:flex-col items-center justify-between gap-4 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all h-full">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-tertiary shadow-sm border border-tertiary/5 shrink-0">
          <span className="material-symbols-rounded text-[32px] font-light">pool</span>
        </div>
        <div>
          <h4 className="font-headline-sm text-[15px] font-semibold text-on-surface">Aquapark Andersa</h4>
          <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">Grudzień 2028</p>
        </div>
      </div>
      <div className="text-right md:text-center mt-2 shrink-0">
        {countdown ? (
          <>
            <div className="text-[15px] font-bold text-primary">Otwarcie za {countdown.days} dni</div>
            <p className="text-[11px] font-medium text-outline font-mono mt-1 bg-surface-container-low px-2 py-0.5 rounded-md inline-block">
              {countdown.hours}h : {countdown.minutes}m : {countdown.seconds}s
            </p>
          </>
        ) : (
          <div className="text-[15px] font-bold text-occupancy-low">Obiekt otwarty! 🎉</div>
        )}
      </div>
    </div>
  )
}
