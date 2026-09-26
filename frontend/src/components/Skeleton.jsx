export default function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`rounded-lg bg-surface-variant/60 motion-safe:animate-pulse ${className}`} />
}

export function ChartSkeleton() {
  return (
    <div role="status" aria-label="Ładowanie wykresu" className="h-full flex flex-col gap-4 p-4">
      <span className="sr-only">Ładowanie wykresu</span>
      <div aria-hidden="true" className="flex-1 flex flex-col justify-between border-l border-b border-outline-variant/40 px-4 py-3">
        {[0, 1, 2, 3].map((row) => <Skeleton key={row} className="h-px w-full" />)}
      </div>
      <div className="flex justify-center gap-5">
        {[0, 1, 2].map((item) => <Skeleton key={item} className="h-3 w-20" />)}
      </div>
    </div>
  )
}
