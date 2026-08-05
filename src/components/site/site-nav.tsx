"use client";
import { useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export type SiteNavItem = { label: string; href: string; hash?: string };

export const siteNavLinks: SiteNavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Fonctionnalités", href: "/fonctionnalites" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "Démo", href: "/demo" },
  { label: "Témoignages", href: "/temoignages" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export function isSiteLinkActive(pathname: string, href: string) {
  return pathname === href;
}

export function useHashScroll(hash?: string) {
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

export function NavLink({
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
    <li>
      <Link
        href={href}
        onClick={(e) => {
          handleClick(e);
          onClick?.();
        }}
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
