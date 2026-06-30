import { InvoicesTableSkeleton } from '@/components/ui/skeletons'

export default function InvoicesLoading() {
  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />
      <div className="relative mx-auto max-w-[1480px] px-6 py-8 lg:px-10">
        <div className="mb-8">
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
        <InvoicesTableSkeleton />
      </div>
    </div>
  )
}
