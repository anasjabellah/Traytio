"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, RotateCw } from "lucide-react"
import { motion } from "framer-motion"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DashboardErrorProps {
  error: Error & { digest?: string }
  reset: () => void
  title?: string
  message?: string
  icon?: React.ReactNode
  backHref?: string
  backLabel?: string
}

export function DashboardError({
  error,
  reset,
  title = "Une erreur est survenue",
  message = "Notre équipe a été notifiée. Vous pouvez réessayer ou retourner au tableau de bord.",
  icon,
  backHref = "/dashboard",
  backLabel = "Tableau de bord",
}: DashboardErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="relative isolate flex min-h-[50vh] items-center justify-center overflow-hidden px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,162,76,0.12),transparent_70%)]"
      />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div
          className="rounded-2xl border border-border/60 bg-card/80 p-0 shadow-lift ring-1 ring-foreground/5 backdrop-blur-sm"
          role="alert"
        >
          <div className="flex flex-col items-center px-8 py-12 text-center sm:px-10">
            <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-gold-soft/40 ring-1 ring-gold-soft/60">
              {icon ?? (
                <AlertTriangle className="size-7 text-[var(--gold-deep)]" strokeWidth={1.8} aria-hidden />
              )}
            </div>

            <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>

            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {message}
            </p>

            <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                onClick={() => reset()}
                variant="default"
                size="lg"
                className="w-full sm:w-auto"
                aria-label="Réessayer de charger la page"
              >
                <RotateCw className="size-4 -ml-0.5 mr-1.5 shrink-0" aria-hidden />
                Réessayer
              </Button>
              <Link
                href={backHref}
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}
                aria-label={`Retour à ${backLabel.toLowerCase()}`}
              >
                <ArrowLeft className="size-4 -ml-0.5 mr-1.5 shrink-0" aria-hidden />
                {backLabel}
              </Link>
            </div>

            {error.digest && (
              <p className="mt-6 select-none text-[11px] text-muted-foreground/40">
                Ref: {error.digest}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
