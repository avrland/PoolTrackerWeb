export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-4" role="status" aria-label="Ładowanie...">
      <div aria-hidden="true" className="h-6 w-6 rounded-full border-2 border-primary/20 border-t-primary motion-safe:animate-spin" />
      <span className="sr-only">Ładowanie...</span>
    </div>
  )
}
