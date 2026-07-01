"use client"

import { useState, useRef, useEffect, useCallback, useLayoutEffect, startTransition } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, Bell, CheckCheck, AlertTriangle, Clock, Menu, ChevronDown, X } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useNotificationStore } from "@/stores/notification-store"
import { useRole } from "@/hooks/use-role"
import { RoleBadge } from "@/components/ui/role-badge"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import type { Module, Action } from "@/lib/permissions"
import { cn } from "@/lib/utils"

type NavItem = [string, string, Module | null, Action | null]

const NAV_ITEMS: NavItem[] = [
  ["Dashboard", "/dashboard", "dashboard" as Module, "view" as Action],
  ["Commandes", "/dashboard/commandes", "commandes" as Module, "read" as Action],
  ["Clients", "/dashboard/clients", "clients" as Module, "read" as Action],
  ["Événements", "/dashboard/events", "events" as Module, "read" as Action],
  ["Calendrier", "/dashboard/calendar", null, null],
  ["Packs", "/dashboard/menus", "menus" as Module, "read" as Action],
  ["Menu Items", "/dashboard/menu-items", "menu-items" as Module, "read" as Action],
  ["Factures", "/dashboard/invoices", "invoices" as Module, "read" as Action],
  ["Paiements", "/dashboard/payments", "payments" as Module, "read" as Action],
  ["Équipe", "/dashboard/settings/team", "team" as Module, "view" as Action],
]

const GAP_PX = 2
const PLUS_ESTIMATE = 76

function MoreDropdown({
  overflowItems, moreOpen, setMoreOpen, isActive,
}: {
  overflowItems: NavItem[];
  moreOpen: boolean;
  setMoreOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isActive: (href: string) => boolean;
}) {
  return (
    <div className="relative" onMouseLeave={() => setMoreOpen(false)}>
      <button
        onClick={() => setMoreOpen((v) => !v)}
        onMouseEnter={() => setMoreOpen(true)}
        className={cn(
          "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0 flex items-center gap-1",
          moreOpen
            ? "bg-foreground/[0.07] text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            : "text-muted-foreground/80 hover:text-foreground hover:bg-foreground/[0.04]",
        )}
        aria-haspopup="true"
        aria-expanded={moreOpen}
        aria-label="Plus de pages"
      >
        Plus
        <ChevronDown
          className={cn("size-3 transition-transform duration-200", moreOpen && "rotate-180")}
          strokeWidth={2}
        />
      </button>
      {moreOpen && (
        <div
          className="absolute left-0 top-full mt-1.5 z-50 w-48 rounded-xl border border-border/50 bg-card shadow-xl py-2 overflow-hidden"
          role="menu"
        >
          {overflowItems.map(([label, href]) => {
            const active = isActive(href)
            return (
              <Link
                key={label}
                href={href}
                role="menuitem"
                className={cn(
                  "block mx-2 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-foreground/[0.06] text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]",
                )}
              >
                {label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function useClickOutside(refs: React.RefObject<HTMLDivElement | null>[], handler: () => void) {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (refs.every((ref) => ref.current && !ref.current.contains(e.target as Node))) handler()
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [refs, handler])
}

export function TopBar() {
  const [notifOpen, setNotifOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore()
  const { role, can } = useRole()
  const { user } = useUser()
  const navWrapperRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [navSplitIndex, setNavSplitIndex] = useState<number | null>(null)

  useClickOutside([notifRef], () => setNotifOpen(false))
  useClickOutside([userRef], () => setUserMenuOpen(false))

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [searchOpen])

  useEffect(() => {
    startTransition(() => {
      setNotifOpen(false)
      setMoreOpen(false)
      setUserMenuOpen(false)
      setSheetOpen(false)
      setSearchOpen(false)
    })
  }, [pathname])

  const visibleItems = NAV_ITEMS.filter(([, , module, action]) => !module || (action && can(module, action)))

  const splitIndex = navSplitIndex ?? visibleItems.length
  const navItems = visibleItems.slice(0, splitIndex)
  const overflowItems = visibleItems.slice(splitIndex)

  useLayoutEffect(() => {
    const wrapper = navWrapperRef.current
    const measure = measureRef.current
    if (!wrapper || !measure || visibleItems.length === 0) return

    function update() {
      const availableWidth = wrapper!.offsetWidth
      const items = Array.from(measure!.children) as HTMLElement[]

      if (items.length === 0) return

      let total = 0
      let allFit = true
      for (let i = 0; i < items.length; i++) {
        if (i > 0) total += GAP_PX
        total += items[i].offsetWidth
        if (total > availableWidth) {
          allFit = false
          break
        }
      }

      if (allFit) {
        setNavSplitIndex(items.length)
        return
      }

      total = 0
      let idx = items.length
      for (let i = 0; i < items.length; i++) {
        const itemW = items[i].offsetWidth
        const withGap = itemW + (i > 0 ? GAP_PX : 0)
        if (total + withGap + GAP_PX + PLUS_ESTIMATE <= availableWidth) {
          total += withGap
        } else {
          idx = i
          break
        }
      }

      setNavSplitIndex(Math.max(1, idx))
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(wrapper)
    return () => ro.disconnect()
  }, [visibleItems])

  const isActive = useCallback(
    (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href)),
    [pathname],
  )

  const navLinkClass = useCallback(
    (href: string) => {
      const active = isActive(href)
      return cn(
        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0",
        active
          ? "bg-foreground/[0.07] text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          : "text-muted-foreground/80 hover:text-foreground hover:bg-foreground/[0.04]",
      )
    },
    [isActive],
  )

  const iconMap: Record<string, typeof AlertTriangle> = { danger: AlertTriangle, warn: Clock, info: AlertTriangle }
  const iconStyles: Record<string, string> = { danger: "text-red-500", warn: "text-amber-500", info: "text-blue-500" }

  const seen = new Map<string, typeof notifications>()
  const groups: Array<{ key: string; title: string; items: typeof notifications }> = []
  for (const n of notifications) {
    const k = n.title
    if (!seen.has(k)) {
      seen.set(k, [])
      groups.push({ key: k, title: k, items: [] })
    }
    seen.get(k)!.push(n)
  }
  for (const g of groups) {
    g.items = notifications.filter((n) => n.title === g.key)
  }

  return (
    <div className="sticky top-0 z-30 bg-background border-b border-border/50">
      <div className="mx-auto max-w-[1480px] flex items-center gap-1.5 lg:gap-3 px-4 lg:px-6 xl:px-10 h-16">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 shrink-0 mr-[32px] xl:mr-[40px]" aria-label="Tableau de bord">
          <div className="size-8 rounded-lg bg-gradient-charcoal flex items-center justify-center shadow-soft">
            <span className="text-white font-display text-lg leading-none">T</span>
          </div>
          <span className="font-display text-2xl tracking-tight hidden sm:inline">tur</span>
        </Link>

        {/* Navigation wrapper — measured by ResizeObserver for dynamic overflow */}
        <div ref={navWrapperRef} className="flex flex-1 min-w-0">
          {/* Desktop navigation (>=1280px) */}
          <nav className="hidden xl:flex items-center gap-0.5 flex-1 min-w-0" aria-label="Navigation principale">
            {navItems.map(([label, href]) => (
              <Link key={label} href={href} className={navLinkClass(href)}>
                {label}
              </Link>
            ))}
            {overflowItems.length > 0 && (
              <MoreDropdown overflowItems={overflowItems} moreOpen={moreOpen} setMoreOpen={setMoreOpen} isActive={isActive} />
            )}
          </nav>

          {/* Tablet navigation (768px - 1279px) */}
          <nav className="hidden md:flex xl:hidden items-center gap-0.5 flex-1 min-w-0" aria-label="Navigation principale">
            {navItems.map(([label, href]) => (
              <Link key={label} href={href} className={navLinkClass(href)}>
                {label}
              </Link>
            ))}
            {overflowItems.length > 0 && (
              <MoreDropdown overflowItems={overflowItems} moreOpen={moreOpen} setMoreOpen={setMoreOpen} isActive={isActive} />
            )}
          </nav>

          {/* Offscreen measurement container — mirrors nav items without affecting layout */}
          <div
            ref={measureRef}
            className="flex items-center gap-0.5 pointer-events-none invisible fixed top-0 left-0"
            aria-hidden="true"
          >
            {visibleItems.map(([label]) => (
              <span key={label} className="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shrink-0">
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Actions: Search + Notifications + Avatar — pushed to far right by nav's flex-1 */}
        <div className="flex items-center gap-2.5 md:gap-3 lg:gap-4 shrink-0">
          {/* Desktop search input */}
          <div
            className="hidden xl:flex items-center gap-2 px-3 h-9 rounded-lg border border-border bg-background/60 text-sm text-muted-foreground flex-1 min-w-0 max-w-[420px] transition-all focus-within:border-gold/50 focus-within:ring-1 focus-within:ring-gold/20"
            tabIndex={0}
            role="search"
            aria-label="Rechercher"
          >
            <Search className="size-4 shrink-0" />
            <span className="truncate whitespace-nowrap">Rechercher...</span>
            <kbd className="ml-auto text-[10px] font-sans px-1.5 py-0.5 rounded border bg-muted/60 shrink-0">⌘K</kbd>
          </div>

          {/* Tablet search input */}
          <div
            className="hidden md:flex xl:hidden items-center gap-2 px-3 h-9 rounded-lg border border-border bg-background/60 text-sm text-muted-foreground flex-1 min-w-0 max-w-[220px] lg:max-w-[320px] transition-all focus-within:border-gold/50 focus-within:ring-1 focus-within:ring-gold/20"
            tabIndex={0}
            role="search"
            aria-label="Rechercher"
          >
            <Search className="size-4 shrink-0" />
            <span className="truncate whitespace-nowrap">Rechercher...</span>
          </div>

          {/* Mobile search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden size-9 rounded-lg border border-border bg-background/60 hover:bg-background hover:border-border/80 flex items-center justify-center transition-all"
            aria-label="Rechercher"
          >
            <Search className="size-4" />
          </button>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative size-9 rounded-lg border border-border bg-background/60 hover:bg-background hover:border-border/80 flex items-center justify-center transition-all"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center px-1 leading-none shadow-sm ring-2 ring-background">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                className="absolute right-0 top-full mt-2 z-50 w-[380px] rounded-xl border border-border/50 bg-card shadow-xl overflow-hidden"
                role="dialog"
                aria-label="Notifications"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/10">
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
                        const Icon = iconMap[group.items[0]?.type] || AlertTriangle
                        const iconStyle = iconStyles[group.items[0]?.type] || "text-muted-foreground"
                        return (
                          <div key={group.key}>
                            <div className="flex items-center gap-2 px-4 py-2 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-[0.08em]">
                              <Icon className={`size-3 ${iconStyle}`} strokeWidth={2} />
                              {group.key.replace("⚠ ", "").replace("⏰ ", "")}
                            </div>
                            {group.items.map((n) => (
                              <button
                                key={n.id}
                                onClick={() => markAsRead(n.id)}
                                className={`w-full text-left px-4 py-2.5 transition-colors hover:bg-muted/30 ${n.read ? "opacity-50" : ""}`}
                              >
                                <p className="text-xs font-medium text-foreground truncate">{n.text}</p>
                                <p className="text-[10px] text-muted-foreground/50 mt-0.5 truncate">
                                  {n.title.replace("⚠ ", "").replace("⏰ ", "")}
                                </p>
                              </button>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User avatar dropdown */}
          <div ref={userRef} className="relative flex items-center">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="size-[42px] md:size-[42px] size-9 rounded-full bg-gradient-charcoal text-white flex items-center justify-center text-xs font-medium shadow-soft shrink-0 hover:shadow-md hover:ring-2 hover:ring-gold/30 hover:ring-offset-1 hover:ring-offset-background transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:ring-offset-2"
              aria-label="Menu utilisateur"
              aria-haspopup="true"
              aria-expanded={userMenuOpen}
            >
              {user?.firstName?.charAt(0)?.toUpperCase() || user?.emailAddresses?.[0]?.emailAddress?.charAt(0)?.toUpperCase() || "U"}
            </button>

            {userMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-border/50 bg-card shadow-xl pt-4 pb-2 overflow-hidden"
                role="menu"
              >
                <div className="px-4 pb-3 border-b border-border/10 mx-2">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user?.firstName || ""}{user?.lastName ? ` ${user.lastName}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                    {user?.emailAddresses?.[0]?.emailAddress || ""}
                  </p>
                  {role && (
                    <div className="mt-2.5">
                      <RoleBadge role={role} />
                    </div>
                  )}
                </div>
                <div className="pt-1.5 space-y-0.5">
                  <Link
                    href="/dashboard"
                    onClick={() => setUserMenuOpen(false)}
                    className="block mx-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] transition-colors"
                    role="menuitem"
                  >
                    Mon Profil
                  </Link>
                  <Link
                    href="/dashboard/settings/team"
                    onClick={() => setUserMenuOpen(false)}
                    className="block mx-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] transition-colors"
                    role="menuitem"
                  >
                    Paramètres
                  </Link>
                  <div className="h-px bg-border/10 mx-2 my-1" />
                  <Link
                    href="#"
                    onClick={() => setUserMenuOpen(false)}
                    className="block mx-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:text-red-600 hover:bg-red-50/50 transition-colors"
                    role="menuitem"
                  >
                    Déconnexion
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setSheetOpen(true)}
            className="md:hidden size-9 rounded-lg border border-border bg-background/60 hover:bg-background hover:border-border/80 flex items-center justify-center transition-all"
            aria-label="Ouvrir le menu"
          >
            <Menu className="size-4" />
          </button>
        </div>
      </div>

      {/* Mobile search dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-[480px] top-[12%] translate-y-0 p-0 gap-0">
          <div className="flex items-center gap-3 px-4 h-14 border-b border-border/10">
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher..."
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/60"
            />
            <button
              onClick={() => setSearchOpen(false)}
              className="size-8 rounded-lg hover:bg-muted/30 flex items-center justify-center"
              aria-label="Fermer"
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile drawer */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" showCloseButton={false} className="w-[280px] p-0">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/10">
              <Link
                href="/dashboard"
                className="flex items-center gap-2"
                onClick={() => setSheetOpen(false)}
                aria-label="Tableau de bord"
              >
                <div className="size-8 rounded-lg bg-gradient-charcoal flex items-center justify-center shadow-soft">
                  <span className="text-white font-display text-lg leading-none">T</span>
                </div>
                <span className="font-display text-2xl tracking-tight">tur</span>
              </Link>
              <button
                onClick={() => setSheetOpen(false)}
                className="size-8 rounded-lg hover:bg-muted/30 flex items-center justify-center"
                aria-label="Fermer le menu"
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-3 px-3" aria-label="Navigation mobile">
              {visibleItems.map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setSheetOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5",
                    isActive(href)
                      ? "bg-foreground/[0.08] text-foreground font-medium shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]",
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="border-t border-border/10 p-4 space-y-1">
              <Link
                href="/dashboard/settings/team"
                onClick={() => setSheetOpen(false)}
                className="flex items-center px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] transition-all"
              >
                Paramètres
              </Link>
              <Link
                href="#"
                onClick={() => setSheetOpen(false)}
                className="flex items-center px-3 py-2.5 rounded-lg text-sm text-red-500 hover:text-red-600 hover:bg-red-50/50 transition-all"
              >
                Déconnexion
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
