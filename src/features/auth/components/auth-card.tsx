"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

export function AuthCard({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
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
