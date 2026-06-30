"use client"

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Compass, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-[#faf7f2] to-background p-4 sm:p-6 overflow-hidden">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-40" />

      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <span
          className="font-display text-[clamp(12rem,40vw,32rem)] font-bold tracking-[-0.06em]"
          style={{ color: "oklch(0.9 0.005 80 / 0.35)" }}
          aria-hidden
        >
          404
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[540px]"
      >
        <div className="relative rounded-3xl border border-[var(--gold)]/30 bg-white/70 backdrop-blur-xl shadow-[0_8px_40px_-8px_rgba(0,0,0,0.08)] p-8 sm:p-12 text-center">
          <motion.div
            className="mx-auto mb-6 size-16 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Compass className="size-7 text-[var(--gold-foreground)]" strokeWidth={1.6} />
          </motion.div>

          <h1 className="font-display text-7xl sm:text-8xl font-bold tracking-[-0.04em] text-gradient-charcoal leading-none">
            404
          </h1>

          <p className="mt-4 text-xl sm:text-2xl font-heading font-semibold text-foreground tracking-tight">
            Page introuvable
          </p>

          <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
            La page que vous recherchez n&apos;existe plus ou a été déplacée.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-charcoal text-white shadow-lift hover:opacity-90 px-5 w-full sm:w-auto text-sm font-medium transition-all"
            >
              <ArrowLeft className="size-4" strokeWidth={2} />
              Retour au tableau de bord
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
        </div>
      </motion.div>
    </div>
  );
}
