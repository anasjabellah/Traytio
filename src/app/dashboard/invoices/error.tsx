"use client"

import { FileText } from "lucide-react"
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
      title="Factures indisponibles"
      message="La liste des factures n'a pas pu être chargée. Vous pouvez réessayer ou revenir au tableau de bord."
      icon={<FileText className="size-7 text-[var(--gold-deep)]" strokeWidth={1.8} aria-hidden />}
    />
  )
}
