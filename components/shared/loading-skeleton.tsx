export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-muted ${className || ""}`}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="h-8 w-32" />
          <LoadingSkeleton className="h-3 w-20" />
        </div>
        <LoadingSkeleton className="h-11 w-11 rounded-xl" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <LoadingSkeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <LoadingSkeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
