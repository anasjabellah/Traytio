"use client";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "./logo-mark";

export function AuthTopbar() {
  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
      className="motion-safe absolute inset-x-0 top-4 z-40 flex justify-center px-4"
    >
      <nav
        aria-label="Navigation de connexion"
        className="glass-1 shadow-soft flex w-full max-w-[1180px] items-center justify-between rounded-full py-2 pl-2.5 pr-3"
      >
        <LogoMark />
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à l&apos;accueil
        </Link>
      </nav>
    </motion.header>
  );
}
