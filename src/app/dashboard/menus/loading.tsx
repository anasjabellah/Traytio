import { Skeleton } from '@/components/ui/skeleton'

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mt-10">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/60 bg-card p-6 space-y-3">
          <div className="flex items-center justify-between mb-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="size-10 rounded-xl" />
          </div>
          <Skeleton className="h-9 w-16" />
        </div>
      ))}
      <div className="col-span-2 rounded-2xl border border-[var(--gold)]/50 bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="size-14 rounded-2xl" />
        </div>
        <div className="mt-4 pt-3 border-t border-[var(--gold)]/20">
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

function ToolbarSkeleton() {
  return (
    <div className="mt-8 rounded-2xl border border-border/60 bg-card/80 p-3 shadow-soft backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-11 flex-1 min-w-[220px] rounded-xl" />
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-8 w-28 rounded-xl" />
      </div>
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="mx-auto w-full max-w-[420px] rounded-3xl border border-stone-200/80 bg-white shadow-[0_4px_24px_-8px_rgba(50,40,20,0.08)] overflow-hidden">
          <Skeleton className="h-[170px] w-full" />
          <div className="p-5 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
            <div className="grid grid-cols-3 gap-2 mt-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-12 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function MenusLoading() {
  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />
      <div className="relative mx-auto max-w-[1480px] px-6 py-8 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Skeleton className="h-5 w-36 rounded-full" />
              <span className="text-muted-foreground/40 mx-1">•</span>
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-14 w-32 rounded-lg" />
            <Skeleton className="h-4 w-96 mt-3" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-40 rounded-lg" />
          </div>
        </div>

        <KpiSkeleton />
        <ToolbarSkeleton />

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <GridSkeleton />
          </div>
          <aside className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
                <Skeleton className="h-4 w-28" />
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <Skeleton className="size-8 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2.5 w-1/2" />
                    </div>
                    <Skeleton className="h-3 w-12" />
                  </div>
                ))}
              </div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  )
}
