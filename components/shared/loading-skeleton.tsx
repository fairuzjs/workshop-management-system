export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800/80 ${className || ""}`}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="h-8 w-32" />
          <LoadingSkeleton className="h-3.5 w-20" />
        </div>
        <LoadingSkeleton className="h-11 w-11 rounded-xl" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4 p-4 rounded-2xl border border-border bg-card">
      <LoadingSkeleton className="h-10 w-full rounded-xl" />
      {Array.from({ length: rows }).map((_, i) => (
        <LoadingSkeleton key={i} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function CardListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="p-4 rounded-2xl border border-border bg-card space-y-3.5">
          <div className="flex items-center justify-between">
            <LoadingSkeleton className="h-5 w-28 rounded-lg" />
            <LoadingSkeleton className="h-5 w-16 rounded-full" />
          </div>
          <LoadingSkeleton className="h-4 w-40 rounded-lg" />
          <div className="flex gap-2 pt-2 border-t border-border/50">
            <LoadingSkeleton className="h-8 flex-1 rounded-xl" />
            <LoadingSkeleton className="h-8 w-16 rounded-xl" />
            <LoadingSkeleton className="h-8 w-16 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <LoadingSkeleton className="h-4 w-24 rounded" />
          <LoadingSkeleton className="h-11 w-full rounded-xl" />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-4 border-t border-border/60">
        <LoadingSkeleton className="h-10 w-24 rounded-xl" />
        <LoadingSkeleton className="h-10 w-24 rounded-xl" />
      </div>
    </div>
  );
}

export function DetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <LoadingSkeleton className="h-7 w-48 rounded" />
          <LoadingSkeleton className="h-4 w-72 rounded" />
        </div>
        <LoadingSkeleton className="h-10 w-32 rounded-xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl border border-border bg-card space-y-3">
            <LoadingSkeleton className="h-4 w-20 rounded" />
            <LoadingSkeleton className="h-6 w-36 rounded" />
          </div>
        ))}
      </div>
      <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
        <LoadingSkeleton className="h-5 w-36 rounded" />
        <LoadingSkeleton className="h-12 w-full rounded-xl" />
        <LoadingSkeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
