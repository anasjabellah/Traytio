"use client";
import { useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const links: { label: string; href: string; hash?: string }[] = [
  { label: "Accueil", href: "/" },
  { label: "Fonctionnalités", href: "/fonctionnalites" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "Démo", href: "/demo" },
  { label: "Témoignages", href: "/temoignages" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

function useHashScroll(hash?: string) {
  const pathname = usePathname();

  return useCallback(
    (e: React.MouseEvent) => {
      if (!hash) return;
      if (pathname === "/") {
        e.preventDefault();
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    },
    [hash, pathname],
  );
}

function NavLink({ href, hash, label, isActive }: { href: string; hash?: string; label: string; isActive: boolean }) {
  const handleClick = useHashScroll(hash);

  return (
    <li>
      <Link
        href={href}
        onClick={handleClick}
        aria-current={isActive && href !== "/" ? "page" : undefined}
        className={`px-4 py-2 rounded-full text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
          isActive
            ? "bg-secondary/80 text-foreground font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
        }`}
      >
        {label}
      </Link>
    </li>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const handleCtaClick = useHashScroll("pricing");

  const isActive = (href: string) => pathname === href;

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
      className="motion-safe fixed top-4 left-1/2 z-50 -translate-x-1/2 w-[min(1180px,calc(100%-2rem))]"
    >
      <nav aria-label="Navigation principale" className="glass-1 shadow-soft rounded-full pl-6 pr-2 py-2 flex items-center justify-between">
        <Link href="/" aria-label="Accueil TUR" className="flex items-center gap-2.5 group">
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-charcoal text-primary-foreground">
            <span className="font-display text-lg leading-none">T</span>
            <span className="absolute -inset-px rounded-full ring-1 ring-gold opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
          <span className="font-display text-2xl tracking-tight">TUR</span>
        </Link>
        <ul className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href} hash={l.hash} label={l.label} isActive={isActive(l.href)} />
          ))}
        </ul>
        <Link
          href="/#pricing"
          onClick={handleCtaClick}
          className="group inline-flex items-center gap-2 rounded-full bg-foreground text-primary-foreground pl-5 pr-2 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors"
        >
          Commencer
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground transition-transform group-hover:translate-x-0.5">
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </nav>
    </motion.header>
  );
}
