import { Skeleton } from '@/components/ui/skeleton'

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-8">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="size-10 rounded-xl" />
          </div>
          <Skeleton className="h-7 w-28" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-8 w-24 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

function FilterSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
      <Skeleton className="h-11 flex-1 max-w-md rounded-xl" />
      <div className="flex items-center gap-2 sm:ml-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-[100px] rounded-xl" />
        ))}
        <Skeleton className="size-11 rounded-xl" />
      </div>
    </div>
  )
}

function SidebarSkeleton() {
  return (
    <div className="w-full xl:w-[30%] mt-6 xl:mt-0 space-y-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/10">
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-7 rounded-lg" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
          <div className="p-3 space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between px-3 py-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function InvoicesLoading() {
  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />
      <div className="relative mx-auto max-w-[1480px] px-6 py-8 lg:px-10">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--gold-soft)]/40 bg-[var(--gold-soft)]/10 text-[11px] font-medium text-[var(--gold-deep)] tracking-wide mb-4">
            <div className="size-3 rounded-full bg-[var(--gold-deep)]/40" />
            Chargement des documents...
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="h-8 w-48 rounded-lg bg-foreground/5 animate-pulse" />
              <div className="h-4 w-64 rounded bg-foreground/5 animate-pulse" />
            </div>
          </div>
        </div>

        <KpiSkeleton />
        <FilterSkeleton />

        <div className="flex flex-col xl:flex-row xl:gap-6">
          <div className="w-full xl:w-[70%] min-w-0">
            <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b border-border/20">
                <div className="flex items-center gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-3 flex-1" />
                  ))}
                </div>
              </div>
              <div className="divide-y divide-border/5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center px-6 py-4 gap-4">
                    <div className="flex items-center gap-2.5 flex-1 max-w-[160px]">
                      <Skeleton className="size-8 rounded-lg shrink-0" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-2.5 w-12" />
                      </div>
                    </div>
                    <Skeleton className="h-3 flex-1 max-w-[120px]" />
                    <Skeleton className="h-3 flex-1 max-w-[140px]" />
                    <Skeleton className="h-3 flex-1 max-w-[100px]" />
                    <Skeleton className="h-6 w-20 rounded-full flex-1 max-w-[80px]" />
                    <Skeleton className="h-3 flex-1 max-w-[120px]" />
                    <Skeleton className="h-3 flex-1 max-w-[100px]" />
                    <Skeleton className="size-8 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <SidebarSkeleton />
        </div>
      </div>
    </div>
  )
}
