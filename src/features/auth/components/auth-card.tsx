"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { LogoMark } from "./logo-mark";

const ease = [0.16, 1, 0.3, 1] as const;

export function AuthCard({
  children,
  centered = false,
}: {
  children: React.ReactNode;
  /** Centered dedicated auth experience (sign-in). Split mode preserves the
      original marketing + form composition (sign-up/invitation). */
  centered?: boolean;
}) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!centered) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={isMounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.7, delay: 0.15, ease }}
        className="relative flex w-full flex-col items-center px-4 py-16 sm:px-8 md:self-start md:py-0 md:pt-28 md:pb-16"
      >
        {/* Mobile-only intro */}
        <div className="mb-8 w-full max-w-[480px] text-center md:hidden">
          <h1 className="font-display text-[2.25rem] leading-[1.05] tracking-tight">
            Gérez votre activité
            <br />
            <span className="italic text-gradient-gold">traiteur</span> en toute
            simplicité.
          </h1>
        </div>

        <div className="motion-safe w-full max-w-[480px]">{children}</div>
      </motion.section>
    );
  }

  return (
    <section className="relative flex w-full flex-col items-center justify-center px-6 py-12 sm:px-10 md:-translate-y-4">
      {/* Quiet zone background: ivory wash, faint grid, soft radial glow */}
      <div aria-hidden className="absolute inset-0 bg-surface-soft/50" />
      <div aria-hidden className="absolute inset-0 grid-bg opacity-60" />
      <div aria-hidden className="absolute inset-x-0 top-0 h-[380px] bg-radiance opacity-60" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={isMounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.7, delay: 0.15, ease }}
        className="relative mx-auto w-full max-w-[440px]"
      >
        <div className="flex items-center gap-3">
          <LogoMark withWordmark={false} />
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Votre espace professionnel
          </span>
        </div>

        <h1 className="mt-6 font-display text-[1.75rem] leading-[1.1] tracking-tight">
          Se connecter
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Accédez à votre espace de gestion.
        </p>

        <div className="mt-8">{children}</div>

        <div className="mt-8 flex items-center gap-1.5 border-t border-border/60 pt-5 text-[11px] text-muted-foreground/70">
          <Lock className="h-3 w-3 shrink-0" />
          <span>Accès sécurisé à votre espace professionnel</span>
        </div>
      </motion.div>
    </section>
  );
}
