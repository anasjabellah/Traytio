"use client"

import { CalendarDays } from "lucide-react"
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
      title="Calendrier indisponible"
      message="Le calendrier n'a pas pu être chargé. Vous pouvez réessayer ou revenir au tableau de bord."
      icon={<CalendarDays className="size-7 text-[var(--gold-deep)]" strokeWidth={1.8} aria-hidden />}
    />
  )
}
