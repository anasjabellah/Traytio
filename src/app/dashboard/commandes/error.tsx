"use client"

import { ShoppingCart } from "lucide-react"
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
      title="Commandes indisponibles"
      message="La liste des commandes n'a pas pu être chargée. Vous pouvez réessayer ou revenir au tableau de bord."
      icon={<ShoppingCart className="size-7 text-[var(--gold-deep)]" strokeWidth={1.8} aria-hidden />}
    />
  )
}
