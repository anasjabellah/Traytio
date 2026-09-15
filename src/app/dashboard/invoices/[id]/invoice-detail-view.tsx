"use client"

import { useCallback, useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { updateInvoiceStatus } from "@/features/invoices/actions/invoice-actions"
import type { InvoiceWithCommande } from "@/features/invoices/types"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft, Download, Send, FileInput, Copy, Trash2,
  ChevronDown, RefreshCw, Loader2, FileText, Receipt,
  Calendar, User, Hash, Wallet, Banknote, CheckCircle2,
  Clock, Tag, ShoppingBag, StickyNote, MapPin,
} from "lucide-react"

const mad = (n: number) =>
  new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 2 }).format(n)

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  DRAFT:    { label: "Brouillon",  color: "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20", dot: "bg-amber-500" },
  SENT:     { label: "Envoyé",     color: "bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20",   dot: "bg-blue-500" },
  VIEWED:   { label: "Vu",         color: "bg-purple-500/10 text-purple-600 ring-1 ring-purple-500/20", dot: "bg-purple-500" },
  ACCEPTED: { label: "Accepté",    color: "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20", dot: "bg-emerald-500" },
  REJECTED: { label: "Rejeté",     color: "bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20",  dot: "bg-rose-500" },
  PAID:     { label: "Payé",       color: "bg-green-500/10 text-green-600 ring-1 ring-green-500/20", dot: "bg-green-500" },
  OVERDUE:  { label: "En retard",  color: "bg-red-500/10 text-red-600 ring-1 ring-red-500/20",      dot: "bg-red-500" },
}

const STATUS_OPTIONS = Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))

const SECTION_ICON =
  "size-7 rounded-lg bg-foreground/[0.04] flex items-center justify-center shrink-0"

function DocTypeChip({ isQuote, typeLabel }: { isQuote: boolean; typeLabel: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ring-1 ${
        isQuote
          ? "bg-blue-500/10 text-blue-600 ring-blue-500/20"
          : "bg-[var(--gold-soft)] text-[var(--gold-deep)] ring-[var(--gold-deep)]/20"
      }`}
    >
      {isQuote
        ? <FileText className="size-3.5" strokeWidth={1.8} />
        : <Receipt className="size-3.5" strokeWidth={1.8} />}
      {typeLabel}
    </span>
  )
}

function StatusChip({ st }: { st: { label: string; color: string; dot: string } }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${st.color}`}>
      <span className={`size-1.5 rounded-full ${st.dot}`} />
      {st.label}
    </span>
  )
}

export default function InvoiceDetailView({ invoice }: { invoice: InvoiceWithCommande }) {
  const router = useRouter()
  const [status, setStatus] = useState(invoice.status)
  const [updating, setUpdating] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const handleStatusChange = useCallback(async (newStatus: string) => {
    setUpdating(true)
    setShowStatusDropdown(false)
    try {
      const result = await updateInvoiceStatus(invoice.id, newStatus)
      if (result.success) {
        setStatus(newStatus as InvoiceWithCommande["status"])
      }
    } catch {
    } finally {
      setUpdating(false)
    }
  }, [invoice.id])

  const handleDownload = useCallback(async () => {
    setDownloading(true)
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
    } finally {
      setDownloading(false)
    }
  }, [invoice.id, invoice.number])

  const client = invoice.commande?.client
  const event = invoice.commande?.event
  const remaining = invoice.totalAmount - invoice.paidAmount
  const st = STATUS_MAP[status] ?? STATUS_MAP.DRAFT
  const typeLabel = invoice.type === "DEVIS" ? "Devis" : "Facture"
  const isQuote = invoice.type === "DEVIS"
  const showGenInvoice = isQuote && status !== "REJECTED"
  const issueDate = new Date(invoice.issueDate).toLocaleDateString("fr-FR")
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("fr-FR") : null

  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />

      <div className="relative mx-auto max-w-[1360px] px-5 sm:px-6 lg:px-10 py-6 lg:py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
        >
          {/* ── Back navigation ── */}
          <button
            onClick={() => router.push("/dashboard/invoices")}
            className="min-h-[44px] md:min-h-0 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            <ArrowLeft className="size-4" strokeWidth={1.8} />
            Retour aux documents
          </button>

          {/* ── Document header card ── */}
          <div className="rounded-2xl border border-border bg-card shadow-soft px-5 py-5 sm:px-6 sm:py-6 mb-6">
            <div className="flex flex-col gap-6 min-w-0 xl:flex-row xl:items-center xl:justify-between">
              {/* Left — identity */}
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <DocTypeChip isQuote={isQuote} typeLabel={typeLabel} />
                  <StatusChip st={st} />
                </div>
                <h1 className="text-section-title text-gradient-charcoal tracking-tight">
                  {invoice.number}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground">
                  {client && (
                    <span className="inline-flex items-center gap-1.5">
                      <User className="size-3.5" strokeWidth={1.8} />
                      {client.company ?? client.name}
                    </span>
                  )}
                  {invoice.commande && (
                    <span className="inline-flex items-center gap-1.5">
                      <Hash className="size-3.5" strokeWidth={1.8} />
                      {invoice.commande.number}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="size-3.5" strokeWidth={1.8} />
                    {issueDate}
                  </span>
                </div>
                <p className="text-card-title text-gradient-charcoal tabular-nums leading-tight tracking-tight">
                  {mad(invoice.totalAmount)}
                </p>
              </div>

              {/* Right — actions */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  variant="charcoal"
                  size="lg"
                  className="min-h-[44px] md:min-h-9"
                  onClick={handleDownload}
                  disabled={downloading}
                  aria-busy={downloading}
                >
                  {downloading
                    ? <Loader2 className="size-3.5 animate-spin" strokeWidth={1.8} />
                    : <Download className="size-3.5" strokeWidth={1.8} />}
                  {downloading ? "Téléchargement..." : "Télécharger"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="min-h-[44px] md:min-h-9"
                  disabled
                  title="Bientôt disponible"
                >
                  <Send className="size-3.5" strokeWidth={1.8} />
                  Envoyer
                </Button>
                {showGenInvoice && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="min-h-[44px] md:min-h-9"
                    disabled
                    title="Bientôt disponible"
                  >
                    <FileInput className="size-3.5" strokeWidth={1.8} />
                    Générer la facture
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  className="min-h-[44px] md:min-h-9"
                  disabled
                  title="Bientôt disponible"
                >
                  <Copy className="size-3.5" strokeWidth={1.8} />
                  Dupliquer
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  className="min-h-[44px] md:min-h-9"
                  disabled
                  title="Bientôt disponible"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.8} />
                  Supprimer
                </Button>

                {/* Status dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowStatusDropdown((v) => !v)}
                    disabled={updating}
                    aria-haspopup="listbox"
                    aria-expanded={showStatusDropdown}
                    className="min-h-[44px] md:min-h-9 px-3 rounded-lg text-xs font-medium transition-all border border-border hover:bg-muted/40 disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {updating
                      ? <RefreshCw className="size-3 animate-spin" strokeWidth={1.5} />
                      : <span className={`size-1.5 rounded-full ${st.dot}`} />}
                    {st.label}
                    <ChevronDown className="size-3" strokeWidth={1.5} />
                  </button>
                  {showStatusDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowStatusDropdown(false)} />
                      <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border border-border bg-card shadow-soft py-1">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleStatusChange(opt.value)}
                            role="option"
                            aria-selected={opt.value === status}
                            className="w-full text-left px-4 py-2 text-xs font-medium text-foreground hover:bg-muted/40 transition-colors flex items-center justify-between"
                          >
                            {opt.label}
                            {opt.value === status && <span className={`size-1.5 rounded-full ${st.dot}`} />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Main content + sidebar ── */}
          <div className="min-w-0 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6">
            {/* Main column */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
              className="min-w-0 space-y-6"
            >
              {/* ── Client / Commande / Document ── */}
              <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/20">

                  <div className="p-5 min-w-0">
                    <div className="flex items-center gap-1.5 mb-3">
                      <User className="size-3 text-muted-foreground" strokeWidth={1.8} />
                      <h3 className="label-micro text-muted-foreground">Client</h3>
                    </div>
                    {client ? (
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-foreground leading-5">{client.company ?? client.name}</p>
                        {client.email && <p className="text-xs text-muted-foreground leading-5">{client.email}</p>}
                        {client.phone && <p className="text-xs text-muted-foreground leading-5">{client.phone}</p>}
                        {client.address && <p className="text-xs text-muted-foreground leading-5">{client.address}</p>}
                        {(client.city || client.postalCode) && (
                          <p className="text-xs text-muted-foreground leading-5">{client.city}{client.postalCode ? ` ${client.postalCode}` : ""}</p>
                        )}
                        {client.siret && <p className="mt-1.5 text-[11px] text-muted-foreground/80 leading-5">SIRET : {client.siret}</p>}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/60">—</p>
                    )}
                  </div>

                  <div className="p-5 min-w-0">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Calendar className="size-3 text-muted-foreground" strokeWidth={1.8} />
                      <h3 className="label-micro text-muted-foreground">Commande / Événement</h3>
                    </div>
                    {invoice.commande ? (
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-foreground leading-5">{invoice.commande.number}</p>
                        {event?.name && <p className="text-xs text-muted-foreground leading-5">{event.name}</p>}
                        {event?.startDate && (
                          <p className="text-xs text-muted-foreground leading-5">{new Date(event.startDate).toLocaleDateString("fr-FR")}</p>
                        )}
                        {event?.location && (
                          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground leading-5">
                            <MapPin className="size-3 shrink-0" strokeWidth={1.8} />
                            {event.location}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/60">—</p>
                    )}
                  </div>

                  <div className="p-5 min-w-0">
                    <div className="flex items-center gap-1.5 mb-3">
                      {isQuote
                        ? <FileText className="size-3 text-muted-foreground" strokeWidth={1.8} />
                        : <Receipt className="size-3 text-muted-foreground" strokeWidth={1.8} />}
                      <h3 className="label-micro text-muted-foreground">Document</h3>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Émission</span>
                        <span className="text-xs font-medium text-foreground">{issueDate}</span>
                      </div>
                      {dueDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Échéance</span>
                          <span className="text-xs font-medium text-foreground">{dueDate}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Type</span>
                        <span className="text-xs font-medium text-foreground">{typeLabel}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Financial summary ── */}
              <div className="rounded-2xl border border-border bg-border/15 shadow-soft overflow-hidden grid grid-cols-2 lg:grid-cols-4 gap-px">
                <div className="bg-card p-4 sm:p-5 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="label-micro text-muted-foreground">Total</div>
                    <div className="size-7 rounded-lg bg-gradient-gold flex items-center justify-center">
                      <Wallet className="size-3.5 text-[var(--gold-foreground)]" strokeWidth={1.8} />
                    </div>
                  </div>
                  <div className="mt-2 text-base sm:text-kpi-value text-foreground tabular-nums leading-tight break-words">
                    {mad(invoice.totalAmount)}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground/70">Montant du document</div>
                </div>
                <div className="bg-card p-4 sm:p-5 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="label-micro text-muted-foreground">Acompte</div>
                    <div className="size-7 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
                      <Banknote className="size-3.5 text-foreground/60" strokeWidth={1.8} />
                    </div>
                  </div>
                  <div className="mt-2 text-base font-semibold text-muted-foreground tabular-nums leading-tight break-words">
                    {invoice.commande?.acompteAmount ? mad(invoice.commande.acompteAmount) : "—"}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground/70">Versé à la réservation</div>
                </div>
                <div className="bg-card p-4 sm:p-5 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="label-micro text-muted-foreground">Payé</div>
                    <div className="size-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="size-3.5 text-emerald-600" strokeWidth={1.8} />
                    </div>
                  </div>
                  <div className="mt-2 text-base font-semibold text-emerald-600 tabular-nums leading-tight break-words">
                    {mad(invoice.paidAmount)}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground/70">Déjà réglé</div>
                </div>
                <div className="bg-card p-4 sm:p-5 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="label-micro text-muted-foreground">Restant</div>
                    <div className="size-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Clock className="size-3.5 text-amber-600" strokeWidth={1.8} />
                    </div>
                  </div>
                  <div className={`mt-2 text-base font-semibold tabular-nums leading-tight break-words ${remaining > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    {remaining > 0 ? mad(remaining) : "Soldé"}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground/70">
                    {remaining > 0 ? "En attente de règlement" : "Document soldé"}
                  </div>
                </div>
              </div>

              {/* ── Articles ── */}
              {invoice.commande?.items && invoice.commande.items.length > 0 && (
                <section className="min-w-0">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className={SECTION_ICON}>
                      <ShoppingBag className="size-3.5 text-foreground/70" strokeWidth={1.8} />
                    </div>
                    <h2 className="text-section-title text-foreground">Articles</h2>
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                      {invoice.commande.items.length} article{invoice.commande.items.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
                    <div className="max-h-[420px] overflow-y-auto overflow-x-auto">
                      <table className="w-full text-sm min-w-[560px]">
                        <thead>
                          <tr className="border-b border-border/30 bg-muted/40">
                            <th className="text-left text-[11px] uppercase tracking-[0.06em] text-muted-foreground font-semibold px-5 py-3.5">Article</th>
                            <th className="text-right text-[11px] uppercase tracking-[0.06em] text-muted-foreground font-semibold px-4 py-3.5 w-24">Quantité</th>
                            <th className="text-right text-[11px] uppercase tracking-[0.06em] text-muted-foreground font-semibold px-4 py-3.5 w-32">Prix unitaire</th>
                            <th className="text-right text-[11px] uppercase tracking-[0.06em] text-muted-foreground font-semibold px-5 py-3.5 w-32">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                          {invoice.commande.items.map((item) => (
                            <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                              <td className="px-5 py-4">
                                <p className="text-sm font-medium text-foreground">{item.name}</p>
                                {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                              </td>
                              <td className="px-4 py-4 text-right text-sm tabular-nums text-foreground">{item.quantity}</td>
                              <td className="px-4 py-4 text-right text-sm tabular-nums text-muted-foreground">{mad(item.unitPrice)}</td>
                              <td className="px-5 py-4 text-right text-sm font-semibold tabular-nums text-foreground">{mad(item.totalPrice)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              )}

              {/* ── Notes / Remise ── */}
              {(invoice.notes || invoice.commande?.clientNotes || invoice.commande?.discountAmount) && (
                <section className="min-w-0">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className={SECTION_ICON}>
                      <StickyNote className="size-3.5 text-foreground/70" strokeWidth={1.8} />
                    </div>
                    <h2 className="text-section-title text-foreground">Informations complémentaires</h2>
                  </div>
                  <div className="rounded-2xl border border-border bg-card shadow-soft px-5 py-5 sm:px-6 space-y-5">
                    {invoice.notes && (
                      <div>
                        <h3 className="label-micro text-muted-foreground mb-2">Notes</h3>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{invoice.notes}</p>
                      </div>
                    )}
                    {!invoice.notes && invoice.commande?.clientNotes && (
                      <div>
                        <h3 className="label-micro text-muted-foreground mb-2">Notes client</h3>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{invoice.commande.clientNotes}</p>
                      </div>
                    )}
                    {invoice.commande?.discountAmount != null && invoice.commande.discountAmount > 0 && (
                      <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-500/10 bg-emerald-500/5 px-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <Tag className="size-3.5 text-emerald-600" strokeWidth={1.8} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">Remise</div>
                            <div className="text-[11px] text-muted-foreground">Réduction accordée</div>
                          </div>
                        </div>
                        <span className="text-sm font-bold tabular-nums text-emerald-600 shrink-0">-{mad(invoice.commande.discountAmount)}</span>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </motion.div>

            {/* ── Résumé sidebar ── */}
            <motion.aside
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const }}
              className="mt-6 min-w-0 lg:mt-0 lg:sticky lg:top-24"
            >
              <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
                <div className="px-5 py-4 border-b border-border/20 flex items-center gap-2.5">
                  <div className={SECTION_ICON}>
                    {isQuote
                      ? <FileText className="size-3.5 text-foreground/70" strokeWidth={1.8} />
                      : <Receipt className="size-3.5 text-foreground/70" strokeWidth={1.8} />}
                  </div>
                  <h3 className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-semibold">Résumé</h3>
                </div>

                {/* Statut */}
                <div className="px-5 py-4 border-b border-border/20 space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">Statut</span>
                    <StatusChip st={st} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">Type</span>
                    <DocTypeChip isQuote={isQuote} typeLabel={typeLabel} />
                  </div>
                </div>

                {/* Finances */}
                <div className="px-5 py-4 border-b border-border/20 space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">Total</span>
                    <span className="text-sm font-semibold text-foreground tabular-nums">{mad(invoice.totalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">Payé</span>
                    <span className="text-sm font-semibold text-emerald-600 tabular-nums">{mad(invoice.paidAmount)}</span>
                  </div>
                  <div className="border-t border-border/20 pt-2.5 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-foreground">Restant</span>
                    <span className={`text-lg font-bold tabular-nums ${remaining > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                      {remaining > 0 ? mad(remaining) : "Soldé"}
                    </span>
                  </div>
                </div>

                {/* Dates */}
                <div className="px-5 py-4 border-b border-border/20">
                  <h4 className="label-micro text-muted-foreground mb-2.5">Dates</h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">Émission</span>
                      <span className="text-xs font-medium text-foreground">{issueDate}</span>
                    </div>
                    {dueDate && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground">Échéance</span>
                        <span className="text-xs font-medium text-foreground">{dueDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-5 py-4 space-y-2">
                  <Button
                    variant="charcoal"
                    size="lg"
                    className="w-full min-h-[44px] md:min-h-9"
                    onClick={handleDownload}
                    disabled={downloading}
                    aria-busy={downloading}
                  >
                    {downloading
                      ? <Loader2 className="size-3.5 animate-spin" strokeWidth={1.8} />
                      : <Download className="size-3.5" strokeWidth={1.8} />}
                    {downloading ? "Exportation..." : "Télécharger le PDF"}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full min-h-[44px] md:min-h-9"
                    disabled
                    title="Bientôt disponible"
                  >
                    <Send className="size-3.5" strokeWidth={1.8} />
                    Envoyer par email
                  </Button>
                  <Button
                    variant="destructive"
                    size="lg"
                    className="w-full min-h-[44px] md:min-h-9"
                    disabled
                    title="Bientôt disponible"
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.8} />
                    Supprimer
                  </Button>
                </div>
              </div>
            </motion.aside>
          </div>
        </motion.div>

        <footer className="mt-10 mb-6 flex items-center justify-between text-xs text-muted-foreground">
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