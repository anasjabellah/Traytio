"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="relative isolate flex min-h-[100dvh] items-center justify-center overflow-hidden bg-background px-4">
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
        <Card className="rounded-2xl border-border/60 bg-card/80 p-0 shadow-lift ring-1 ring-foreground/5 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center px-8 py-12 text-center sm:px-10">
            <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-gold-soft/40 ring-1 ring-gold-soft/60">
              <AlertTriangle className="size-7 text-[var(--gold-deep)]" strokeWidth={1.8} aria-hidden />
            </div>
            <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              Une erreur est survenue
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Notre équipe a été notifiée. Vous pouvez réessayer ou retourner au tableau de bord.
            </p>
            <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                onClick={() => reset()}
                variant="default"
                size="lg"
                className="w-full sm:w-auto"
                aria-label="Réessayer de charger la page"
              >
                Réessayer
              </Button>
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}
                aria-label="Retour au tableau de bord"
              >
                Retour au tableau de bord
              </Link>
            </div>
            {error.digest && (
              <p className="mt-6 text-[11px] text-muted-foreground/40 select-none">
                Ref: {error.digest}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
