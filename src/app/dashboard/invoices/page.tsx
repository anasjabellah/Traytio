"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { getInvoices, updateInvoiceStatus } from "@/features/invoices/actions/invoice-actions"
import type { InvoiceWithCommande } from "@/features/invoices/types"
import { Search, Download, FileText, Sparkles, RefreshCw, ChevronLeft, ChevronRight, Receipt, Settings } from "lucide-react"
import { PageGuard } from "@/components/ui/page-guard"

const mad = (n: number) =>
  new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 2 }).format(n)

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon", SENT: "Envoyé", VIEWED: "Vu",
  ACCEPTED: "Accepté", REJECTED: "Rejeté", PAID: "Payé", OVERDUE: "En retard",
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  SENT: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60",
  VIEWED: "bg-purple-50 text-purple-700 ring-1 ring-purple-200/60",
  ACCEPTED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300/60",
  REJECTED: "bg-rose-50 text-rose-700 ring-1 ring-rose-200/60",
  PAID: "bg-green-50 text-green-700 ring-1 ring-green-300/60",
  OVERDUE: "bg-red-50 text-red-700 ring-1 ring-red-200/60",
}

const TYPE_FILTERS = [
  { value: "", label: "Tous" },
  { value: "DEVIS", label: "Devis" },
  { value: "FACTURE", label: "Factures" },
]

const PAGE_SIZES = [10, 25, 50, 100]

function getPageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "ellipsis")[] = [1]
  if (current > 4) pages.push("ellipsis")
  const start = Math.max(2, current - 2)
  const end = Math.min(total - 1, current + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 3) pages.push("ellipsis")
  pages.push(total)
  return pages
}

function SkeletonRows() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center px-6 py-4 border-b border-border/5">
          <div className="flex-1 flex items-center gap-3">
            <div className="size-8 rounded-lg bg-foreground/5" />
            <div className="space-y-1.5">
              <div className="h-3 w-28 rounded bg-foreground/5" />
              <div className="h-2.5 w-16 rounded bg-foreground/5" />
            </div>
          </div>
          <div className="flex-1"><div className="h-3 w-20 rounded bg-foreground/5" /></div>
          <div className="flex-1"><div className="h-3 w-24 rounded bg-foreground/5" /></div>
          <div className="flex-1"><div className="h-3 w-16 rounded bg-foreground/5" /></div>
          <div className="flex-1"><div className="h-6 w-20 rounded-full bg-foreground/5" /></div>
          <div className="flex-1"><div className="h-3 w-16 rounded bg-foreground/5 ml-auto" /></div>
          <div className="flex-1"><div className="h-3 w-12 rounded bg-foreground/5 ml-auto" /></div>
          <div className="w-[120px] flex justify-center"><div className="size-8 rounded-lg bg-foreground/5" /></div>
        </div>
      ))}
    </div>
  )
}

export default function InvoicesPage() {
  return (
    <PageGuard module="invoices" action="read">
      <InvoicesPageContent />
    </PageGuard>
  )
}

function InvoicesPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const pageParam = parseInt(searchParams.get("page") ?? "1", 10)
  const limitParam = parseInt(searchParams.get("limit") ?? "10", 10)
  const typeParam = searchParams.get("type") ?? ""
  const searchParam = searchParams.get("search") ?? ""

  const [invoices, setInvoices] = useState<InvoiceWithCommande[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState(searchParam)

  const typeFilter = TYPE_FILTERS.some((f) => f.value === typeParam) ? typeParam : ""
  const limit = [10, 25, 50, 100].includes(limitParam) ? limitParam : 10
  const page = Math.max(1, pageParam)

  const updateUrl = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [router, pathname, searchParams])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const result = await getInvoices({
          type: typeFilter ? (typeFilter as "DEVIS" | "FACTURE") : undefined,
          search: search || undefined,
          page,
          limit,
        })
        if (mounted && result.success && result.data) {
          setInvoices(result.data.data)
          setTotal(result.data.total)
          setTotalPages(result.data.totalPages)
        }
      } catch {
        // silent
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [page, limit, typeFilter, search])

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    updateUrl({ search: value || undefined, page: undefined })
  }, [updateUrl])

  const handleTypeFilter = useCallback((value: string) => {
    updateUrl({ type: value || undefined, page: undefined, search: undefined })
    setSearch("")
  }, [updateUrl])

  const handlePageChange = useCallback((p: number) => {
    updateUrl({ page: p > 1 ? String(p) : undefined })
  }, [updateUrl])

  const handleLimitChange = useCallback((newLimit: number) => {
    updateUrl({ limit: newLimit !== 10 ? String(newLimit) : undefined, page: undefined })
  }, [updateUrl])

  const refetch = useCallback(() => {
    setLoading(true)
    getInvoices({
      type: typeFilter ? (typeFilter as "DEVIS" | "FACTURE") : undefined,
      search: search || undefined,
      page,
      limit,
    }).then((result) => {
      if (result.success && result.data) {
        setInvoices(result.data.data)
        setTotal(result.data.total)
        setTotalPages(result.data.totalPages)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [page, limit, typeFilter, search])

  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  const handleRowClick = useCallback((id: string) => {
    router.push(`/dashboard/invoices/${id}`)
  }, [router])

  const handleDownload = useCallback(async (e: React.MouseEvent, invoice: InvoiceWithCommande) => {
    e.stopPropagation()
    try {
      const resp = await fetch(`/api/invoices/${invoice.id}/pdf`)
      if (!resp.ok) return
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${invoice.number}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // silent
    }
  }, [])

  const handleStatusChange = useCallback(async (id: string, status: string) => {
    const result = await updateInvoiceStatus(id, status)
    if (result.success) {
      refetch()
    }
  }, [refetch])

  const pageWindow = useMemo(() => getPageWindow(page, totalPages), [page, totalPages])
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

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
            Documents financiers
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl lg:text-5xl text-gradient-charcoal leading-[1.05]">
                Devis & Factures
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                {total} document{total > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 px-4 h-11 rounded-xl border border-border bg-card shadow-soft flex-1 max-w-md transition-all focus-within:border-[var(--gold-deep)] focus-within:ring-1 focus-within:ring-[var(--gold-deep)]/20">
              <Search size={18} strokeWidth={1.8} className="text-muted-foreground shrink-0" />
              <input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Numéro de document..."
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {TYPE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => handleTypeFilter(f.value)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
                    typeFilter === f.value
                      ? "border-[var(--gold-deep)] bg-[var(--gold-soft)]/20 text-[var(--gold-deep)]"
                      : "border-border bg-card shadow-soft text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <button
                onClick={() => router.push("/dashboard/invoices/settings")}
                className="h-11 px-3 rounded-xl border border-border bg-card shadow-soft text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 text-xs font-medium"
              >
                <Settings className="size-[15px]" strokeWidth={1.8} />
                Paramètres
              </button>
              <button
                onClick={handleRefresh}
                className="size-11 rounded-xl border border-border bg-card shadow-soft text-muted-foreground hover:text-foreground transition-all flex items-center justify-center"
              >
                <RefreshCw className={`size-[18px] ${loading ? "animate-spin" : ""}`} strokeWidth={1.8} />
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
          {loading ? (
            <SkeletonRows />
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FileText className="size-12 text-muted-foreground/20 mb-4" strokeWidth={1.2} />
              <p className="text-sm text-muted-foreground/60 font-medium">
                {search || typeFilter ? "Aucun document ne correspond à votre recherche" : "Aucun document trouvé"}
              </p>
              {(search || typeFilter) && (
                <button
                  onClick={() => {
                    setSearch("")
                    router.push(pathname)
                  }}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-medium border border-border bg-card shadow-soft text-muted-foreground hover:text-foreground transition-all"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/20">
                      <th className="text-left text-[11px] uppercase tracking-[0.08em] text-foreground/50 font-semibold px-6 py-4">Document</th>
                      <th className="text-left text-[11px] uppercase tracking-[0.08em] text-foreground/50 font-semibold px-4 py-4">Commande</th>
                      <th className="text-left text-[11px] uppercase tracking-[0.08em] text-foreground/50 font-semibold px-4 py-4">Client</th>
                      <th className="text-left text-[11px] uppercase tracking-[0.08em] text-foreground/50 font-semibold px-4 py-4">Date</th>
                      <th className="text-left text-[11px] uppercase tracking-[0.08em] text-foreground/50 font-semibold px-4 py-4">Statut</th>
                      <th className="text-right text-[11px] uppercase tracking-[0.08em] text-foreground/50 font-semibold px-4 py-4">Montant</th>
                      <th className="text-right text-[11px] uppercase tracking-[0.08em] text-foreground/50 font-semibold px-4 py-4">Payé</th>
                      <th className="text-center text-[11px] uppercase tracking-[0.08em] text-foreground/50 font-semibold px-4 py-4 w-[120px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/5">
                    {invoices.map((inv) => (
                      <tr
                        key={inv.id}
                        onClick={() => handleRowClick(inv.id)}
                        className="transition-colors hover:bg-foreground/[0.03] cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
                              {inv.type === "DEVIS" ? (
                                <FileText className="size-4 text-blue-600" strokeWidth={1.8} />
                              ) : (
                                <Receipt className="size-4 text-[var(--gold-deep)]" strokeWidth={1.8} />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-foreground">{inv.number}</div>
                              <div className="text-[10px] text-foreground/50">
                                {inv.type === "DEVIS" ? "Devis" : "Facture"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-foreground/70">{inv.commande?.number ?? "—"}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-foreground/70">{inv.commande?.client?.name ?? "—"}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-foreground/70">
                            {new Date(inv.issueDate).toLocaleDateString("fr-FR")}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={inv.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                            className={`text-[11px] px-2 py-1 rounded-full font-semibold border-0 cursor-pointer ${STATUS_COLORS[inv.status] ?? "bg-gray-100 text-gray-500"}`}
                          >
                            {Object.entries(STATUS_LABELS).map(([key, label]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-semibold tabular-nums text-foreground">{mad(inv.totalAmount)}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm tabular-nums text-emerald-600">{mad(inv.paidAmount)}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => handleDownload(e, inv)}
                              className="size-8 rounded-lg border border-border bg-white hover:bg-foreground/[0.02] text-foreground/60 hover:text-foreground transition-all flex items-center justify-center"
                              title="Télécharger"
                            >
                              <Download className="size-3.5" strokeWidth={1.8} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 border-t border-border/10 bg-card/50">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="text-xs text-muted-foreground shrink-0">
                    {startItem}–{endItem} sur {total} document{total > 1 ? "s" : ""}
                  </div>

                  <div className="flex items-center justify-center flex-1">
                    {totalPages > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page <= 1 || loading}
                          className="h-7 px-2.5 rounded-md border border-border flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="size-3.5" />
                          <span className="hidden sm:inline">Précédent</span>
                        </button>

                        {pageWindow.map((p, i) =>
                          p === "ellipsis" ? (
                            <span key={`e-${i}`} className="w-6 h-7 flex items-center justify-center text-xs text-muted-foreground/30 select-none">
                              …
                            </span>
                          ) : (
                            <button
                              key={p}
                              onClick={() => handlePageChange(p)}
                              disabled={loading}
                              className={`min-w-[28px] h-7 rounded-md text-xs font-medium transition-all ${
                                p === page
                                  ? "bg-foreground text-background shadow-sm"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                              } disabled:cursor-not-allowed`}
                            >
                              {p}
                            </button>
                          )
                        )}

                        <button
                          onClick={() => handlePageChange(page + 1)}
                          disabled={page >= totalPages || loading}
                          className="h-7 px-2.5 rounded-md border border-border flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <span className="hidden sm:inline">Suivant</span>
                          <ChevronRight className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                    <span>Lignes par page:</span>
                    <select
                      value={limit}
                      onChange={(e) => handleLimitChange(Number(e.target.value))}
                      className="text-xs bg-transparent border border-border rounded-md px-2 py-1 text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--gold-deep)]/30"
                    >
                      {PAGE_SIZES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </>
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
