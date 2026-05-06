import { useState, useEffect } from 'react'

const AQUAPARK_URL =
  'https://www.lech.net.pl/pl/aktualnosci/bedziemy-budowac-aquapark-w-bialymstoku-.html'
const TARGET = new Date('2028-12-15T00:00:00')

export default function CountdownCard() {
  // null means opened (target date passed), otherwise { days, hours, minutes, seconds }
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
    <article className="weather-card" aria-label="Odliczanie do otwarcia aquaparku">
      <div className="weather-card__title">
        🏗️ Aquapark Andersa{' '}
        <span style={{ fontWeight: 400, opacity: 0.75 }}>| Grudzień 2028</span>
      </div>

      {countdown !== null ? (
        <>
          <div className="weather-card__temp" style={{ fontSize: '1.6rem', lineHeight: 1.2 }}>
            <a
              href={AQUAPARK_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              Otwarcie za {countdown.days} dni
            </a>
          </div>
          <div className="weather-card__desc" style={{ marginTop: '0.3rem' }}>
            <a
              href={AQUAPARK_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              {countdown.hours} godzin, {countdown.minutes} minut,{' '}
              {countdown.seconds} sekund
            </a>
          </div>
        </>
      ) : (
        <div className="weather-card__desc" style={{ marginTop: '0.75rem' }}>
          Aquapark jest już otwarty! 🎉
        </div>
      )}
    </article>
  )
}
