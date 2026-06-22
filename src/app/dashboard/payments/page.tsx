"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { KpiCard } from "@/shared/components/kpi-card"
import {
  Search, X, Plus, Wallet, CreditCard, Landmark, Ban, Receipt,
  TrendingUp, Sparkles, RefreshCw, ArrowUpRight,
} from "lucide-react"
import { getPayments, type PaymentWithCommande, type PaymentStats } from "@/features/payments/actions/get-payments"

const mad = (n: number) =>
  new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(n)

const formatDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })

const METHOD_ICONS: Record<string, typeof CreditCard> = {
  CASH: Wallet,
  CARD: CreditCard,
  TRANSFER: Landmark,
  CHECK: Receipt,
  OTHER: Ban,
}

const METHOD_LABELS: Record<string, string> = {
  CASH: "Espèces",
  CARD: "Carte",
  TRANSFER: "Virement",
  CHECK: "Chèque",
  OTHER: "Autre",
}

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: "Complété",
  PENDING: "En attente",
  FAILED: "Échoué",
  REFUNDED: "Remboursé",
}

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-800",
  PENDING: "bg-amber-100 text-amber-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-200 text-gray-700",
}

const METHOD_FILTERS = ["", "CASH", "CARD", "TRANSFER", "CHECK", "OTHER"] as const
const STATUS_FILTERS = ["", "COMPLETED", "PENDING", "FAILED", "REFUNDED"] as const

export default function PaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<PaymentWithCommande[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [localSearch, setLocalSearch] = useState("")
  const [methodFilter, setMethodFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const loadPayments = async () => {
    setIsLoading(true)
    try {
      const result = await getPayments({
        search: localSearch || undefined,
        method: methodFilter || undefined,
        status: statusFilter || undefined,
      })
      setPayments(result.data)
      setStats(result.stats)
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [methodFilter, statusFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== undefined) loadPayments()
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearch])

  const kpiCards = useMemo(() => {
    if (!stats) return []
    const monthlyDelta = stats.previousMonthRevenue > 0
      ? Math.round(((stats.monthlyRevenue - stats.previousMonthRevenue) / stats.previousMonthRevenue) * 100)
      : 0

    return [
      {
        label: "Total collecté",
        value: stats.totalCollected,
        prefix: "MAD" as const,
        delta: 0,
        trend: "up" as const,
        spark: [1, 1, 1, 1, 1, 1, 1],
        icon: Wallet,
        accent: true,
      },
      {
        label: "Revenu du mois",
        value: stats.monthlyRevenue,
        prefix: "MAD" as const,
        delta: monthlyDelta,
        trend: (monthlyDelta >= 0 ? "up" : "down") as "up" | "down",
        spark: [1, 1, 1, 1, 1, 1, 1],
        icon: TrendingUp,
      },
      {
        label: "Remboursé",
        value: stats.totalRefunded,
        prefix: "MAD" as const,
        delta: 0,
        trend: "down" as const,
        spark: [1, 1, 1, 1, 1, 1, 1],
        icon: Ban,
      },
      {
        label: "En attente",
        value: stats.pendingCount,
        delta: 0,
        trend: "up" as const,
        spark: [1, 1, 1, 1, 1, 1, 1],
        icon: Receipt,
      },
    ]
  }, [stats])

  const subtitleParts = [
    stats && `${stats.totalCollected > 0 ? mad(stats.totalCollected) : "0 MAD"} collecté`,
    stats && stats.pendingCount > 0 && `${stats.pendingCount} paiement${stats.pendingCount > 1 ? "s" : ""} en attente`,
  ].filter(Boolean) as string[]

  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />

      <div className="relative mx-auto max-w-[1480px] px-6 py-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--gold-soft)]/40 bg-[var(--gold-soft)]/10 text-[11px] font-medium text-[var(--gold-deep)] tracking-wide mb-4">
            <Sparkles className="size-3" strokeWidth={2} />
            Centre financier
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl lg:text-5xl text-gradient-charcoal leading-[1.05]">
                Paiements
              </h1>
              {subtitleParts.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1.5">
                  {subtitleParts.join(" · ")}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {kpiCards.length > 0 && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {kpiCards.map((k, i) => (
              <KpiCard key={k.label} {...k} delay={i * 0.05} />
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
          className="mt-8 mb-4 space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 px-4 h-11 rounded-xl border border-border bg-card shadow-soft flex-1 max-w-md transition-all focus-within:border-[var(--gold-deep)] focus-within:ring-1 focus-within:ring-[var(--gold-deep)]/20">
              <Search size={18} strokeWidth={1.8} className="text-muted-foreground shrink-0" />
              <input
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Référence, commande, notes…"
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/50"
              />
              {localSearch && (
                <button onClick={() => setLocalSearch("")} className="size-5 rounded-full hover:bg-secondary flex items-center justify-center">
                  <X className="size-3 text-muted-foreground" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="h-11 px-3 rounded-xl border border-border bg-card shadow-soft text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--gold-deep)]/20"
              >
                <option value="">Toutes méthodes</option>
                {METHOD_FILTERS.filter(Boolean).map((m) => (
                  <option key={m} value={m}>{METHOD_LABELS[m] ?? m}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 px-3 rounded-xl border border-border bg-card shadow-soft text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--gold-deep)]/20"
              >
                <option value="">Tous statuts</option>
                {STATUS_FILTERS.filter(Boolean).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
                ))}
              </select>

              <button
                onClick={loadPayments}
                className="size-11 rounded-xl border border-border bg-card shadow-soft text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all flex items-center justify-center"
                title="Actualiser"
              >
                <RefreshCw className={`size-[18px] ${isLoading ? "animate-spin" : ""}`} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
          className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/40 font-semibold">Historique</div>
              <h3 className="font-display text-xl mt-0.5">Tous les paiements</h3>
            </div>
            <span className="text-xs text-muted-foreground/60">
              {isLoading ? "…" : `${payments.length} paiement${payments.length > 1 ? "s" : ""}`}
            </span>
          </div>

          {isLoading ? (
            <div className="px-6 py-16 flex items-center justify-center">
              <div className="size-8 rounded-full border-2 border-[var(--gold-deep)]/30 border-t-[var(--gold-deep)] animate-spin" />
            </div>
          ) : payments.length === 0 ? (
            <div className="px-6 py-16 flex flex-col items-center justify-center text-center">
              <div className="size-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                <Receipt className="size-5 text-emerald-500" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-foreground/60">Aucun paiement trouvé</p>
              <p className="text-xs text-foreground/50 mt-1">
                {localSearch || methodFilter || statusFilter
                  ? "Essayez de modifier vos filtres."
                  : "Aucun paiement enregistré pour le moment."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-y border-border/30">
                    <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.08em] text-muted-foreground/50 font-semibold">Montant</th>
                    <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.08em] text-muted-foreground/50 font-semibold">Méthode</th>
                    <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.08em] text-muted-foreground/50 font-semibold">Statut</th>
                    <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.08em] text-muted-foreground/50 font-semibold">Commande</th>
                    <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.08em] text-muted-foreground/50 font-semibold">Référence</th>
                    <th className="text-left px-6 py-3 text-[11px] uppercase tracking-[0.08em] text-muted-foreground/50 font-semibold">Date</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const Icon = METHOD_ICONS[payment.method] ?? Ban
                    return (
                      <tr
                        key={payment.id}
                        className="border-b border-border/10 last:border-0 transition-colors hover:bg-foreground/[0.02]"
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold tabular-nums text-foreground">
                            {mad(payment.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-md bg-emerald-50 flex items-center justify-center">
                              <Icon className="size-3.5 text-emerald-600" strokeWidth={1.8} />
                            </div>
                            <span className="text-sm text-foreground/80">
                              {METHOD_LABELS[payment.method] ?? payment.method}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[11px] px-2 py-1 rounded-full font-semibold ${STATUS_STYLES[payment.status] ?? "bg-gray-100 text-gray-500"}`}>
                            {STATUS_LABELS[payment.status] ?? payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/dashboard/commandes/${payment.commande.id}`}
                            className="flex items-center gap-1.5 text-sm text-foreground/80 hover:text-[var(--gold-deep)] transition-colors group"
                          >
                            <span className="font-medium">{payment.commande.number}</span>
                            {payment.commande.clientName && (
                              <>
                                <span className="text-muted-foreground/30 mx-0.5">—</span>
                                <span className="text-muted-foreground/60 text-xs">{payment.commande.clientName}</span>
                              </>
                            )}
                            <ArrowUpRight className="size-3 text-muted-foreground/30 group-hover:text-[var(--gold-deep)] transition-colors shrink-0" />
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-foreground/60">
                            {payment.reference || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-foreground/60 tabular-nums">
                            {formatDate(payment.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {payment.notes && (
                            <span className="text-[11px] text-muted-foreground/50 italic" title={payment.notes}>
                              {payment.notes.length > 30 ? payment.notes.slice(0, 30) + "…" : payment.notes}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        <footer className="mt-16 mb-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            Tous les services opérationnels
          </div>
          <div>© TUR — Suite traiteur premium</div>
        </footer>
      </div>
    </div>
  )
}
