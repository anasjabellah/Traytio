"use client"

import { PartyPopper } from "lucide-react"
import { DashboardError } from "@/components/ui/dashboard-error"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <DashboardError
      error={error}
      reset={reset}
      title="Événements indisponibles"
      message="La liste des événements n'a pas pu être chargée. Vous pouvez réessayer ou revenir au tableau de bord."
      icon={<PartyPopper className="size-7 text-[var(--gold-deep)]" strokeWidth={1.8} aria-hidden />}
    />
  )
}
