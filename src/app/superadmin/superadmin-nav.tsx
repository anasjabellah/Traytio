"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Shield } from "lucide-react"

const TABS = [
  { label: "Console", href: "/superadmin" },
  { label: "Organizations", href: "#" },
  { label: "Audit Logs", href: "#" },
  { label: "System", href: "#" },
  { label: "Billing", href: "#" },
]

export function SuperadminTopBar() {
  const pathname = usePathname()

  return (
    <div className="sticky top-0 z-30 bg-background border-b border-border/50">
      <div className="mx-auto flex max-w-[1480px] items-center gap-1.5 lg:gap-3 px-4 lg:px-6 xl:px-10 h-16">
        <Link
          href="/superadmin"
          className="flex items-center gap-3 shrink-0 mr-[32px] xl:mr-[40px]"
          aria-label="Superadmin"
        >
          <div className="size-8 rounded-lg bg-gradient-charcoal flex items-center justify-center shadow-soft">
            <Shield className="size-4 text-white" />
          </div>
          <span className="font-display text-2xl tracking-tight hidden sm:inline text-foreground/80">
            Superadmin
          </span>
        </Link>

        <nav className="flex items-center gap-0.5" aria-label="Superadmin navigation">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
                  tab.href === "#" && "pointer-events-none opacity-50",
                  isActive
                    ? "bg-foreground/[0.07] text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                    : "text-muted-foreground/80 hover:text-foreground hover:bg-foreground/[0.04]",
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
