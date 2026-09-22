"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { LogoMark } from "./logo-mark";
import { DashboardMockup } from "./dashboard-mockup";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Sign-in split composition (inspired by 21st.dev auth-section-3 proportions,
 * rebuilt 100% Traytio-native): product auth form left, ivory product panel
 * right. Brand block → our single H1/subtitle → real Clerk form → trust.
 * Auth behavior is 100% Clerk; this file is presentation only.
 */
export function SignInView({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="relative flex min-h-svh flex-col bg-background">
      {/* Quiet Traytio atmosphere */}
      <div aria-hidden className="absolute inset-0 bg-gradient-mesh opacity-60" />
      <div aria-hidden className="absolute inset-0 grid-bg opacity-70" />
      <div aria-hidden className="absolute inset-x-0 top-0 h-[420px] bg-radiance opacity-70" />

      {/* Minimal auth header */}
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={isMounted ? { y: 0, opacity: 1 } : { y: -16, opacity: 0 }}
        transition={{ duration: 0.6, ease }}
        className="relative z-10 mx-auto flex w-full max-w-[1280px] items-center justify-between px-6 py-5"
      >
        <LogoMark />
        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Retour au site
        </Link>
      </motion.header>

      {/* Split composition */}
      <main className="relative z-10 mx-auto grid w-full max-w-[1280px] flex-1 grid-cols-1 items-center gap-10 px-6 pb-12 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:px-10">
        {/* LEFT — authentication */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={isMounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.7, delay: 0.1, ease }}
          className="mx-auto w-full max-w-[440px]"
          aria-label="Connexion"
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

          <div className="mt-6">{children}</div>

          <div className="mt-8 flex items-center gap-1.5 border-t border-border/60 pt-5 text-[11px] text-muted-foreground/70">
            <Lock className="h-3 w-3 shrink-0" />
            <span>Accès sécurisé à votre espace professionnel</span>
          </div>
        </motion.section>

        {/* RIGHT — Traytio product panel */}
        <motion.aside
          initial={{ opacity: 0, y: 24 }}
          animate={isMounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.7, delay: 0.2, ease }}
          className="relative hidden lg:block"
          aria-label="Aperçu produit Traytio"
        >
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-surface-soft px-10 pb-10 pt-12">
            <div aria-hidden className="absolute inset-0 grid-bg opacity-60" />
            <div
              aria-hidden
              className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-gradient-gold opacity-20 blur-3xl"
            />
            <div className="relative">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Traytio
              </span>
              <p className="mt-4 font-display text-[2rem] leading-[1.12] tracking-tight">
                Pilotez vos événements
                <br />
                en toute <span className="italic text-gradient-gold">simplicité</span>.
              </p>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Commandes, clients, événements et facturation réunis dans un
                seul espace.
              </p>
              <div className="mx-auto mt-8 w-full max-w-[520px]">
                <DashboardMockup />
              </div>
            </div>
          </div>
        </motion.aside>
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-[1280px] px-6 pb-6 text-center text-[11px] text-muted-foreground/50">
        © {new Date().getFullYear()} Traytio
      </footer>
    </div>
  );
}
