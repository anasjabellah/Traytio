import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />
      <div className="relative mx-auto max-w-[1480px] px-6 py-8 lg:px-10">
        <div className="flex items-center gap-4">
          <Skeleton className="size-9 rounded-xl" />
          <div>
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-48 mt-1.5" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          <Skeleton className="h-9 w-64 rounded-lg" />
          <Skeleton className="h-9 w-40 rounded-lg" />
          <Skeleton className="h-9 w-40 rounded-lg" />
        </div>
        <div className="mt-6 rounded-2xl border border-border bg-card shadow-soft overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
          <Skeleton className="h-[500px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
