import { useRef, useEffect } from 'react'

const DAY_ORDER = [
  'Poniedziałek',
  'Wtorek',
  'Środa',
  'Czwartek',
  'Piątek',
  'Sobota',
  'Niedziela',
]

export default function PoolModal({ isOpen, onClose, title, hours }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen) {
      if (!dialog.open) dialog.showModal()
    } else {
      if (dialog.open) dialog.close()
    }
  }, [isOpen])

  function handleBackdropClick(e) {
    if (e.target === dialogRef.current) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="pool-modal"
      onClose={onClose}
      onClick={handleBackdropClick}
      aria-labelledby="pool-modal-title"
      aria-modal="true"
    >
      <div className="pool-modal__content">
        <div className="pool-modal__header">
          <h2 className="pool-modal__title" id="pool-modal-title">
            {title} — godziny otwarcia
          </h2>
          <button
            className="pool-modal__close"
            onClick={onClose}
            aria-label="Zamknij okno"
          >
            ✕
          </button>
        </div>

        <table className="pool-modal__table" aria-label={`Godziny otwarcia: ${title}`}>
          <thead>
            <tr>
              <th scope="col">Dzień</th>
              <th scope="col">Godziny</th>
            </tr>
          </thead>
          <tbody>
            {DAY_ORDER.map((day) => (
              <tr key={day}>
                <td>{day}</td>
                <td>{hours[day] ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </dialog>
  )
}
