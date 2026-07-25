import { Skeleton } from '@/components/ui/skeleton';

export function ActivitySkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div>
              <Skeleton className="h-7 w-20 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <div className="flex gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Timeline card */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-8">
        {Array.from({ length: 2 }).map((_, g) => (
          <div key={g}>
            <div className="flex items-center gap-2.5 mb-4">
              <Skeleton className="size-1.5 rounded-full shrink-0" />
              <Skeleton className="h-3 w-24" />
              <div className="flex-1 h-px bg-border/20" />
            </div>

            <div className="relative">
              <div className="absolute left-7 top-2 bottom-2 w-px bg-border/10" />
              {Array.from({ length: 3 }).map((_, r) => (
                <div key={r} className="relative flex items-start gap-3 py-2.5 px-3">
                  <Skeleton className="size-8 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5 pt-0.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
