"use client";

import Link from "next/link";
import { Search, Bell } from "lucide-react";

export function TopBar() {
  return (
    <div className="sticky top-0 z-40 glass border-b border-border/60">
      <div className="mx-auto max-w-[1480px] flex items-center gap-4 px-6 lg:px-10 h-16">
        <Link href="/dashboard/commandes/new" className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gradient-charcoal flex items-center justify-center shadow-soft">
            <span className="text-white font-display text-lg leading-none">T</span>
          </div>
          <span className="font-display text-2xl tracking-tight">tur</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-6 text-sm">
          {["Dashboard", "Commandes", "Clients", "Menus", "Calendrier", "Paiements"].map((n, i) => (
            <a key={n} className={`px-3 py-1.5 rounded-md transition-colors ${i === 0 ? "bg-foreground/[0.06] text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"}`}>
              {n}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 px-3 h-9 rounded-md border border-border bg-background/60 text-sm text-muted-foreground w-72">
            <Search className="size-4" />
            <span className="truncate whitespace-nowrap">
              Rechercher commandes, clients...
            </span>
            <kbd className="ml-auto text-[10px] font-sans px-1.5 py-0.5 rounded border bg-muted/60">⌘K</kbd>
          </div>
          <button className="relative size-9 rounded-md border border-border bg-background/60 hover:bg-background flex items-center justify-center">
            <Bell className="size-4" />
            <span className="absolute top-2 right-2 size-1.5 rounded-full bg-[var(--gold-deep)]" />
          </button>
          <div className="size-9 rounded-full bg-gradient-charcoal text-white flex items-center justify-center text-xs font-medium shadow-soft">
            AN
          </div>
        </div>
      </div>
    </div>
  );
}
