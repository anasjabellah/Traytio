'use client'

import { CalendarDays } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />
      <div className="relative mx-auto max-w-[1480px] px-6 py-8 lg:px-10">
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
          <div className="size-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-4">
            <CalendarDays className="size-7 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Une erreur est survenue
          </h3>
          <p className="text-sm text-muted-foreground/70 max-w-sm mb-6">
            {error.message || "Le calendrier n'a pas pu être chargé."}
          </p>
          <button
            onClick={reset}
            className="h-9 px-4 rounded-lg bg-gold text-white text-sm font-medium hover:bg-gold/90 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    </div>
  )
}
