"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, Bell, CheckCheck, AlertTriangle, Clock } from "lucide-react";
import { useNotificationStore } from "@/stores/notification-store";

export function TopBar() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const iconMap: Record<string, typeof AlertTriangle> = {
    danger: AlertTriangle,
    warn: Clock,
    info: AlertTriangle,
  };

  const iconStyles: Record<string, string> = {
    danger: "text-red-500",
    warn: "text-amber-500",
    info: "text-blue-500",
  };

  const seen = new Map<string, typeof notifications>();
  const groups: Array<{ key: string; title: string; items: typeof notifications }> = [];
  for (const n of notifications) {
    const k = n.title;
    if (!seen.has(k)) {
      seen.set(k, []);
      groups.push({ key: k, title: k, items: [] });
    }
    seen.get(k)!.push(n);
  }
  // Rebuild groups with actual items
  for (const g of groups) {
    g.items = notifications.filter((n) => n.title === g.key);
  }

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
          <div ref={ref} className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="relative size-9 rounded-md border border-border bg-background/60 hover:bg-background flex items-center justify-center"
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <>
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500 ring-2 ring-background" />
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center px-1 leading-none shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </>
              )}
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-2 z-50 w-[380px] rounded-xl border border-border/60 bg-card shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
                  <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <CheckCheck className="size-3" strokeWidth={1.8} />
                      Tout marquer lu
                    </button>
                  )}
                </div>

                <div className="max-h-[320px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <Bell className="size-8 text-muted-foreground/30 mb-2" strokeWidth={1.2} />
                      <p className="text-xs text-muted-foreground/50 font-medium">Aucune notification</p>
                    </div>
                  ) : (
                    <div className="py-1">
                      {groups.map((group) => {
                        const Icon = iconMap[group.items[0]?.type] || AlertTriangle;
                        const iconStyle = iconStyles[group.items[0]?.type] || 'text-muted-foreground';
                        return (
                          <div key={group.key}>
                            <div className="flex items-center gap-2 px-4 py-2 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-[0.08em]">
                              <Icon className={`size-3 ${iconStyle}`} strokeWidth={2} />
                              {group.key.replace('⚠ ', '').replace('⏰ ', '')}
                            </div>
                            {group.items.map((n) => (
                              <button
                                key={n.id}
                                onClick={() => markAsRead(n.id)}
                                className={`w-full text-left px-4 py-2.5 transition-colors hover:bg-muted/30 ${n.read ? 'opacity-50' : ''}`}
                              >
                                <p className="text-xs font-medium text-foreground truncate">{n.text}</p>
                                <p className="text-[10px] text-muted-foreground/50 mt-0.5 truncate">{n.title.replace('⚠ ', '').replace('⏰ ', '')}</p>
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="size-9 rounded-full bg-gradient-charcoal text-white flex items-center justify-center text-xs font-medium shadow-soft">
            AN
          </div>
        </div>
      </div>
    </div>
  );
}
