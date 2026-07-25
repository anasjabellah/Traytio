"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { KpiCard } from "@/shared/components/kpi-card"
import {
  Search, X, Plus, Wallet, CreditCard, Landmark, Ban, Receipt,
  TrendingUp, Sparkles, RefreshCw, ArrowUpRight, Calendar,
  CircleDollarSign, Clock, Lightbulb, FileText,
} from "lucide-react"
import { usePayments } from "@/features/payments/hooks/use-payments"
import { Pagination } from "@/components/ui/pagination"
import { computeKpi } from "@/features/dashboard/lib/kpi-engine"
import type { PaymentWithCommande, PaymentStats, PaginatedPayments } from "@/features/payments/types"
import { PageGuard } from "@/components/ui/page-guard"
import { PaymentRowCard } from "@/features/payments/components/PaymentRowCard"

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

interface PaymentsPageClientProps {
  initialData?: PaginatedPayments | null;
}

export function PaymentsPageClient({ initialData }: PaymentsPageClientProps) {
  return (
    <PageGuard module="payments" action="read">
      <PaymentsPageContent initialData={initialData} />
    </PageGuard>
  )
}

function hasValidTrend(spark: number[]): boolean {
  return spark.length >= 2 && spark[spark.length - 2] > 0;
}

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'hier'
  return `il y a ${days} jours`
}

function PaymentsPageContent({ initialData }: { initialData?: PaginatedPayments | null }) {
  const router = useRouter()
  const [localSearch, setLocalSearch] = useState("")
  const [methodFilter, setMethodFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const { payments, stats, isLoading, error, pagination, handleSearch, handlePageChange, handleLimitChange, refresh } = usePayments(
    initialData,
    methodFilter || undefined,
    statusFilter || undefined,
  )

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(localSearch), 300)
    return () => clearTimeout(timer)
  }, [localSearch, handleSearch])

  const collectedKpi = useMemo(() => computeKpi(stats?.perfCollected ?? []), [stats?.perfCollected])
  const collectedTrendValid = useMemo(() => hasValidTrend(stats?.perfCollected ?? []), [stats?.perfCollected])
  const revenueKpi = useMemo(() => computeKpi(stats?.perfRevenue ?? []), [stats?.perfRevenue])
  const revenueTrendValid = useMemo(() => hasValidTrend(stats?.perfRevenue ?? []), [stats?.perfRevenue])
  const refundedKpi = useMemo(() => computeKpi(stats?.perfRefunded ?? []), [stats?.perfRefunded])
  const refundedTrendValid = useMemo(() => hasValidTrend(stats?.perfRefunded ?? []), [stats?.perfRefunded])
  const pendingKpi = useMemo(() => computeKpi(stats?.perfPending ?? []), [stats?.perfPending])
  const pendingTrendValid = useMemo(() => hasValidTrend(stats?.perfPending ?? []), [stats?.perfPending])

  const subtitleParts = [
    stats && `${stats.totalCollected > 0 ? mad(stats.totalCollected) : "0 MAD"} collecté`,
    stats && stats.pendingCount > 0 && `${stats.pendingCount} paiement${stats.pendingCount > 1 ? "s" : ""} en attente`,
  ].filter(Boolean) as string[]

  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />

      <div className="relative mx-auto max-w-[1480px] px-6 py-8 lg:px-10">
        {/* ═══ HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] as const }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--gold-soft)]/40 bg-[var(--gold-soft)]/10 text-[11px] font-medium text-[var(--gold-deep)] tracking-wide mb-4">
            <Sparkles className="size-3" strokeWidth={2} />
            Centre financier
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl text-gradient-charcoal leading-[1.05]">
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

        {/* ═══ KPI CARDS ═══ */}
        {!stats ? null : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-8">
            <KpiCard
              label="Total collecté"
              value={stats.totalCollected}
              prefix="MAD"
              icon={Wallet}
              accent
              {...collectedKpi}
              hideTrend={!collectedTrendValid}
            />
            <KpiCard
              label="Revenu du mois"
              value={stats.monthlyRevenue}
              prefix="MAD"
              icon={TrendingUp}
              {...revenueKpi}
              hideTrend={!revenueTrendValid}
            />
            <KpiCard
              label="Remboursé"
              value={stats.totalRefunded}
              prefix="MAD"
              icon={Ban}
              {...refundedKpi}
              hideTrend={!refundedTrendValid}
            />
            <KpiCard
              label="En attente"
              value={stats.pendingCount}
              icon={Receipt}
              {...pendingKpi}
              hideTrend={!pendingTrendValid}
            />
          </div>
        )}

        {/* ═══ FILTERS ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.15, ease: [0.22, 1, 0.36, 1] as const }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 px-4 h-11 rounded-xl border border-border bg-card shadow-soft w-full sm:max-w-sm xl:max-w-md transition-all focus-within:border-[var(--gold-deep)] focus-within:ring-1 focus-within:ring-[var(--gold-deep)]/20">
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

            <div className="flex items-center gap-2 sm:ml-auto">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="flex-1 min-w-0 sm:flex-none h-11 px-3 rounded-xl border border-border bg-card shadow-soft text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--gold-deep)]/20"
              >
                <option value="">Toutes méthodes</option>
                {METHOD_FILTERS.filter(Boolean).map((m) => (
                  <option key={m} value={m}>{METHOD_LABELS[m] ?? m}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 min-w-0 sm:flex-none h-11 px-3 rounded-xl border border-border bg-card shadow-soft text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--gold-deep)]/20"
              >
                <option value="">Tous statuts</option>
                {STATUS_FILTERS.filter(Boolean).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
                ))}
              </select>

              <button
                onClick={refresh}
                className="flex-none w-12 h-12 sm:size-11 sm:min-w-[44px] sm:min-h-[44px] rounded-xl border border-border bg-card shadow-soft text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all flex items-center justify-center"
                title="Actualiser"
              >
                <RefreshCw className={`size-[18px] ${isLoading ? "animate-spin" : ""}`} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* ═══ MAIN LAYOUT: TABLE + SIDEBAR ═══ */}
        <div className="flex flex-col xl:flex-row xl:gap-6">
          {/* LEFT: TABLE */}
          <div className="w-full xl:w-[70%] min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.15, ease: [0.22, 1, 0.36, 1] as const }}
            >
              {isLoading ? (
                <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
                  <div className="px-6 py-16 flex items-center justify-center">
                    <div className="size-8 rounded-full border-2 border-[var(--gold-deep)]/30 border-t-[var(--gold-deep)] animate-spin" />
                  </div>
                </div>
              ) : payments.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
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
                </div>
              ) : (
                <>
                  <div className="hidden md:block rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
                    <div className="flex items-center justify-between px-6 pt-5 pb-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/40 font-semibold">Historique</div>
                        <h3 className="font-display text-xl mt-0.5">Tous les paiements</h3>
                      </div>
                      <span className="text-xs text-muted-foreground/60">
                        {isLoading ? "…" : `${pagination.total} paiement${pagination.total > 1 ? "s" : ""}`}
                      </span>
                    </div>

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
                    {pagination.totalPages > 1 && (
                      <Pagination
                        page={pagination.page}
                        totalPages={pagination.totalPages}
                        total={pagination.total}
                        limit={pagination.limit}
                        onPageChange={handlePageChange}
                        onLimitChange={handleLimitChange}
                        itemLabel="paiement"
                      />
                    )}
                  </div>

                  <div className="md:hidden space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-xl">Tous les paiements</h3>
                      <span className="text-xs text-muted-foreground/60">
                        {pagination.total} paiement{pagination.total > 1 ? "s" : ""}
                      </span>
                    </div>
                    {payments.map((payment, i) => (
                      <PaymentRowCard key={payment.id} payment={payment} index={i} />
                    ))}
                    {pagination.totalPages > 1 && (
                      <Pagination
                        page={pagination.page}
                        totalPages={pagination.totalPages}
                        total={pagination.total}
                        limit={pagination.limit}
                        onPageChange={handlePageChange}
                        onLimitChange={handleLimitChange}
                        itemLabel="paiement"
                      />
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </div>

          {/* RIGHT: SIDEBAR */}
          <div className="w-full xl:w-[30%] mt-6 xl:mt-0 space-y-5">
            {/* CARD 1: Paiements aujourd'hui */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12, duration: 0.15, ease: [0.22, 1, 0.36, 1] as const }}
              className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-border/10">
                <div className="flex items-center gap-2.5">
                  <div className="size-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Calendar className="size-3.5 text-emerald-600" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Paiements aujourd'hui</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {stats ? `${stats.todayPayments.count} paiement${stats.todayPayments.count > 1 ? 's' : ''}` : '—'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                {!stats || stats.todayPayments.count === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Receipt className="size-8 text-muted-foreground/20 mb-2" strokeWidth={1.5} />
                    <p className="text-xs text-muted-foreground/60">Aucun paiement aujourd'hui</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-foreground/[0.02]">
                      <span className="text-[13px] text-foreground/70">Nombre de paiements</span>
                      <span className="text-sm font-semibold tabular-nums text-foreground">{stats.todayPayments.count}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-foreground/[0.02]">
                      <span className="text-[13px] text-foreground/70">Total collecté</span>
                      <span className="text-sm font-semibold tabular-nums text-emerald-600">{mad(stats.todayPayments.total)}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* CARD 2: Répartition des méthodes */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.16, duration: 0.15, ease: [0.22, 1, 0.36, 1] as const }}
              className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-border/10">
                <div className="flex items-center gap-2.5">
                  <div className="size-7 rounded-lg bg-blue-50 flex items-center justify-center">
                    <CreditCard className="size-3.5 text-blue-600" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Répartition des méthodes</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {stats ? `${stats.methodBreakdown.length} méthode${stats.methodBreakdown.length > 1 ? 's' : ''}` : '—'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-3 space-y-1">
                {!stats || stats.methodBreakdown.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Ban className="size-8 text-muted-foreground/20 mb-2" strokeWidth={1.5} />
                    <p className="text-xs text-muted-foreground/60">Aucune donnée disponible</p>
                  </div>
                ) : (
                  stats.methodBreakdown.map((m) => {
                    const Icon = METHOD_ICONS[m.method] ?? Ban
                    const totalCollected = stats.totalCollected || 1
                    const pct = Math.round((m.total / totalCollected) * 100)
                    return (
                      <div
                        key={m.method}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-foreground/[0.03] transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className="size-3.5 shrink-0 text-emerald-600" strokeWidth={2} />
                          <span className="text-[13px] font-medium text-foreground truncate">{METHOD_LABELS[m.method] ?? m.method}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <span className="text-[11px] text-muted-foreground tabular-nums">{pct}%</span>
                          <span className="text-[13px] font-semibold tabular-nums text-foreground">{mad(m.total)}</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </motion.div>

            {/* CARD 3: Stats rapides */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.15, ease: [0.22, 1, 0.36, 1] as const }}
              className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-border/10">
                <div className="flex items-center gap-2.5">
                  <div className="size-7 rounded-lg bg-amber-50 flex items-center justify-center">
                    <CircleDollarSign className="size-3.5 text-amber-600" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Stats rapides</h3>
                    <p className="text-[11px] text-muted-foreground">Indicateurs clés</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Montant moyen</p>
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {stats ? mad(stats.quickStats.averageAmount) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Paiements complétés</p>
                    <p className="text-sm font-semibold tabular-nums text-emerald-600">
                      {stats?.quickStats.completedCount ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Plus grand paiement</p>
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {stats ? mad(stats.quickStats.largestPayment) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-1">En attente / Remboursé</p>
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {stats ? `${stats.quickStats.pendingCount} / ${stats.quickStats.refundedCount}` : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CARD 4: Insights */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.24, duration: 0.15, ease: [0.22, 1, 0.36, 1] as const }}
              className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-border/10">
                <div className="flex items-center gap-2.5">
                  <div className="size-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Lightbulb className="size-3.5 text-indigo-600" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Insights</h3>
                    <p className="text-[11px] text-muted-foreground">Analyse rapide</p>
                  </div>
                </div>
              </div>
              <div className="p-3">
                {!stats || stats.insights.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <FileText className="size-7 text-muted-foreground/20 mb-2" strokeWidth={1.5} />
                    <p className="text-xs text-muted-foreground/60">Aucune donnée disponible</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stats.insights.map((insight, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 px-3 py-2 rounded-xl bg-foreground/[0.02]"
                      >
                        <div className="size-1.5 rounded-full bg-[var(--gold-deep)] mt-1.5 shrink-0" />
                        <p className="text-[12px] text-foreground/80 leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

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
