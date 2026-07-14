"use client"

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
      title="Impossible de charger cette page"
      message="Une erreur est survenue dans le tableau de bord. Vous pouvez réessayer ou retourner à l'accueil."
    />
  )
}
