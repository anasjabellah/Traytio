"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Compass, ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardNotFound() {
  const router = useRouter()

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm text-center"
      >
        <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-gold-soft/40 ring-1 ring-gold-soft/60">
          <Compass className="size-7 text-[var(--gold-deep)]" strokeWidth={1.6} aria-hidden />
        </div>

        <h1 className="font-display text-6xl font-bold tracking-[-0.04em] text-foreground leading-none">
          404
        </h1>

        <p className="mt-3 text-lg font-heading font-semibold text-foreground tracking-tight">
          Page introuvable
        </p>

        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Cette page n&apos;existe pas ou a été déplacée.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-charcoal text-white shadow-lift hover:opacity-90 px-5 w-full sm:w-auto text-sm font-medium transition-all"
          >
            <ArrowLeft className="size-4" strokeWidth={2} />
            Tableau de bord
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="h-11 rounded-xl gap-2 px-5 w-full sm:w-auto border-border/60"
            onClick={() => router.back()}
          >
            <ArrowRight className="size-4" strokeWidth={2} />
            Page précédente
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
