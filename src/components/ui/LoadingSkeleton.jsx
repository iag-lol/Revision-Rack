function Skeleton({ className }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
}

export function KPISkeleton() {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-3 w-24 mb-3" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="w-11 h-11 rounded-xl" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={`h-4 flex-1 ${j === 0 ? 'max-w-24' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-3 w-28 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}

export default Skeleton
