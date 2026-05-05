export default function LoadingSpinner() {
  return (
    <div className="loading-spinner" role="status" aria-label="Ładowanie...">
      <div className="spinner" />
      <span className="visually-hidden">Ładowanie...</span>
    </div>
  )
}
