"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { siteNavLinks, useHashScroll, isSiteLinkActive } from "@/components/site/site-nav";
import { cn } from "@/lib/utils";

const DRAWER_ID = "site-mobile-menu";
const EASE = [0.22, 1, 0.36, 1] as const;

const trustPoints = ["Essai gratuit", "Sans engagement", "Configuration en 2 minutes"];

function MobileNavLink({
  href,
  hash,
  label,
  isActive,
  onClick,
}: {
  href: string;
  hash?: string;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}) {
  const handleClick = useHashScroll(hash);

  return (
    <Link
      href={href}
      onClick={(e) => {
        handleClick(e);
        onClick?.();
      }}
      aria-current={isActive && href !== "/" ? "page" : undefined}
      className="group relative flex h-11 items-center rounded-xl px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      {isActive && (
        <span
          aria-hidden="true"
          className="absolute left-[9px] top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gold"
        />
      )}
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full px-6 py-2 text-sm transition-all duration-200",
          isActive
            ? "w-[72%] h-11 bg-gold-soft text-gold-deep font-medium"
            : "text-foreground/80 group-hover:bg-secondary/70 group-hover:text-foreground",
        )}
      >
        {label}
      </span>
    </Link>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const handleCtaClick = useHashScroll("pricing");
  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-controls={DRAWER_ID}
          className="inline-flex size-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 max-[375px]:size-9"
        >
          <span className="relative block h-3.5 w-5" aria-hidden="true">
            <span
              className={cn(
                "absolute left-0 top-0 h-[2px] w-full rounded-full bg-foreground transition-transform duration-300 ease-out",
                open && "top-1/2 -translate-y-1/2 rotate-45",
              )}
            />
            <span
              className={cn(
                "absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 rounded-full bg-foreground transition-all duration-300 ease-out",
                open && "opacity-0",
              )}
            />
            <span
              className={cn(
                "absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-foreground transition-transform duration-300 ease-out",
                open && "bottom-1/2 translate-y-1/2 -rotate-45",
              )}
            />
          </span>
        </SheetTrigger>

        <SheetContent
          id={DRAWER_ID}
          side="right"
          showCloseButton={false}
          overlayClassName="bg-charcoal/45"
          className="data-[side=right]:w-[90vw] max-w-[420px] gap-0 p-0 duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        >
          <SheetTitle className="sr-only">Menu principal</SheetTitle>
          <div className="flex h-full flex-col overflow-hidden">
            <header className="flex shrink-0 items-center justify-between border-b border-border/10 px-4 pb-3 pt-6">
              <Link href="/" onClick={close} aria-label="Accueil TUR" className="flex items-center gap-2.5 px-2">
                <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-charcoal text-primary-foreground">
                  <span className="font-display text-lg leading-none">T</span>
                </span>
                <span className="font-display text-2xl tracking-tight">TUR</span>
              </Link>
              <button
                type="button"
                onClick={close}
                aria-label="Fermer le menu"
                className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-secondary/80 hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <X className="size-6" />
              </button>
            </header>

            <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4">
              <nav aria-label="Navigation mobile" className="w-full">
                <ul className="space-y-5">
                  {siteNavLinks.map((l, i) => (
                    <motion.li
                      key={l.href}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: EASE, delay: i * 0.025 }}
                      className="motion-safe"
                    >
                      <MobileNavLink
                        href={l.href}
                        hash={l.hash}
                        label={l.label}
                        isActive={isSiteLinkActive(pathname, l.href)}
                        onClick={close}
                      />
                    </motion.li>
                  ))}
                </ul>
              </nav>

              <footer className="flex w-full flex-col items-center gap-5 border-t border-border/10 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-5">
                <div className="flex w-full flex-col items-center gap-4">
                  <motion.ul
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: EASE, delay: 0.2 }}
                    className="motion-safe space-y-1.5"
                  >
                    {trustPoints.map((t) => (
                      <li key={t} className="flex items-center gap-2 text-sm text-foreground/70">
                        <Check className="size-3.5 shrink-0 text-gold-deep" />
                        {t}
                      </li>
                    ))}
                  </motion.ul>

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: EASE, delay: 0.25 }}
                    className="motion-safe w-full"
                  >
                    <Link
                      href="/#pricing"
                      onClick={(e) => {
                        handleCtaClick(e);
                        close();
                      }}
                      className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-gold py-3.5 text-sm font-semibold text-gold-foreground shadow-[0_4px_12px_rgba(212,162,76,0.16),0_16px_48px_rgba(212,162,76,0.28)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(212,162,76,0.20),0_20px_56px_rgba(212,162,76,0.38)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      Commencer
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </motion.div>
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
                  className="motion-safe text-center text-xs text-neutral-400"
                >
                  © 2026 TUR
                </motion.p>
              </footer>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
