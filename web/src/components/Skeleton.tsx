interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] rounded ${className}`}
      style={{ animation: "shimmer 1.8s linear infinite" }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-2.5 w-20" />
      </div>
      <Skeleton className="h-7 w-24" />
    </div>
  );
}

export function SkeletonRings() {
  return (
    <div className="card p-5 flex items-center justify-around gap-4">
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-32 w-32 rounded-full" />
        <Skeleton className="h-2.5 w-16" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-32 w-32 rounded-full" />
        <Skeleton className="h-2.5 w-20" />
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="card p-4 space-y-3">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card p-4 space-y-3">
      <Skeleton className="h-3 w-28 mb-2" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-2.5 flex-1" />
          <Skeleton className="h-2.5 w-12" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonGoal() {
  return (
    <div className="card p-4 flex items-center gap-4">
      <Skeleton className="h-24 w-24 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-2.5 w-28" />
        <Skeleton className="h-2.5 w-20" />
      </div>
    </div>
  );
}
