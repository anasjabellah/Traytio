"use client"

import {
  Shield, Building2, Activity, BarChart3, Database, Flag, Settings, Eye,
} from "lucide-react"
import Link from "next/link"

type CardProps = {
  title: string
  description: string
  icon: React.ReactNode
  href?: string
  comingSoon?: boolean
}

const cards: CardProps[] = [
  {
    title: "Sentry",
    description: "View & configure error tracking across all organizations",
    icon: <Shield className="size-5" />,
    comingSoon: true,
  },
  {
    title: "Billing",
    description: "View & manage subscriptions, Stripe dashboard access",
    icon: <Building2 className="size-5" />,
    comingSoon: true,
  },
  {
    title: "Organizations",
    description: "List, impersonate & manage all organizations",
    icon: <Building2 className="size-5" />,
    comingSoon: true,
  },
  {
    title: "Feature Flags",
    description: "Create, update & delete feature flags globally",
    icon: <Flag className="size-5" />,
    comingSoon: true,
  },
  {
    title: "System Metrics",
    description: "View system-wide performance & health metrics",
    icon: <BarChart3 className="size-5" />,
    comingSoon: true,
  },
  {
    title: "Audit Logs",
    description: "View all actions across every organization",
    icon: <Activity className="size-5" />,
    comingSoon: true,
  },
  {
    title: "Database Access",
    description: "Read-only emergency access to the database",
    icon: <Database className="size-5" />,
    comingSoon: true,
  },
  {
    title: "Configuration",
    description: "Global SaaS configuration & settings",
    icon: <Settings className="size-5" />,
    comingSoon: true,
  },
]

export default function SuperadminPage() {
  return (
    <div className="relative min-h-screen bg-[var(--surface-soft)]">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />

      <div className="relative mx-auto max-w-[1480px] px-6 py-8 lg:px-10">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-medium text-foreground lg:text-4xl">
            Console
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            God-mode access across all organizations. SUPERADMIN actions are logged with an extra audit trail.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => (
            <SuperadminCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </div>
  )
}

function SuperadminCard({ title, description, icon, href, comingSoon }: CardProps) {
  const content = (
    <div
      className={`group relative rounded-xl border bg-card p-5 shadow-soft transition-all duration-200 ${
        comingSoon
          ? 'border-border/40 opacity-60'
          : href
            ? 'border-border hover:border-gold/50 hover:shadow-lift'
            : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex size-10 items-center justify-center rounded-lg bg-gold-soft text-gold">
          {icon}
        </div>
        {comingSoon && (
          <span className="rounded-md border border-border/40 bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            Bientôt
          </span>
        )}
      </div>
      <h3 className="mt-4 font-display text-base font-medium text-foreground">
        {title}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  )

  if (href && !comingSoon) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
