"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Check, LogIn, Play, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { siteNavLinks, useHashScroll, isSiteLinkActive } from "@/components/site/site-nav";
import { cn } from "@/lib/utils";

const DRAWER_ID = "site-mobile-menu";
const EASE = [0.16, 1, 0.3, 1] as const;

const quickActions: { label: string; href: string; icon: LucideIcon; hash?: string }[] = [
  { label: "Commencer", href: "/#pricing", icon: ArrowRight, hash: "pricing" },
  { label: "Voir une démo", href: "/demo", icon: Play },
  { label: "Se connecter", href: "/sign-in", icon: LogIn },
];

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
      className={cn(
        "relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        isActive
          ? "bg-gold-soft text-gold-deep font-medium"
          : "text-foreground/75 hover:bg-secondary/80 hover:text-foreground",
      )}
    >
      {isActive && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gold"
        />
      )}
      {label}
    </Link>
  );
}

function MobileQuickLink({
  label,
  href,
  icon: Icon,
  hash,
  onClick,
}: {
  label: string;
  href: string;
  icon: LucideIcon;
  hash?: string;
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
      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-foreground/75 transition-colors hover:bg-secondary/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <Icon className="size-4 shrink-0 text-gold-deep" />
      {label}
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
          className="inline-flex size-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
          className="w-[85vw] max-w-[360px] gap-0 p-0 duration-300 ease-out"
        >
          <SheetTitle className="sr-only">Menu principal</SheetTitle>
          <div className="flex h-full flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/10 px-4 py-2.5">
              <Link href="/" onClick={close} aria-label="Accueil TUR" className="flex items-center gap-2.5 px-2 py-1">
                <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-charcoal text-primary-foreground">
                  <span className="font-display text-lg leading-none">T</span>
                </span>
                <span className="font-display text-2xl tracking-tight">TUR</span>
              </Link>
              <button
                type="button"
                onClick={close}
                aria-label="Fermer le menu"
                className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <X className="size-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-4">
              <nav aria-label="Navigation mobile">
                <ul className="space-y-0.5">
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

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE, delay: siteNavLinks.length * 0.025 + 0.05 }}
                className="motion-safe mt-4 border-t border-border/10 pt-4"
              >
                <p className="px-4 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Actions rapides
                </p>
                <ul className="space-y-0.5">
                  {quickActions.map((a, i) => (
                    <motion.li
                      key={a.href + a.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: EASE, delay: siteNavLinks.length * 0.025 + 0.05 + (i + 1) * 0.025 }}
                      className="motion-safe"
                    >
                      <MobileQuickLink
                        label={a.label}
                        href={a.href}
                        icon={a.icon}
                        hash={a.hash}
                        onClick={close}
                      />
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border/10 px-5 pb-3 pt-4">
              <motion.ul
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE, delay: 0.2 }}
                className="motion-safe space-y-1.5"
              >
                {trustPoints.map((t) => (
                  <li key={t} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="size-3.5 shrink-0 text-gold-deep" />
                    {t}
                  </li>
                ))}
              </motion.ul>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE, delay: 0.25 }}
                className="motion-safe"
              >
                <Link
                  href="/#pricing"
                  onClick={(e) => {
                    handleCtaClick(e);
                    close();
                  }}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-gold py-3.5 text-sm font-semibold text-gold-foreground shadow-gold transition-all hover:scale-[1.02] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.99]"
                >
                  Commencer
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
                className="motion-safe pt-1 text-center text-[11px] text-muted-foreground/70"
              >
                © 2026 TUR
              </motion.p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
