"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { updateInvoiceStatus } from "@/features/invoices/actions/invoice-actions"
import type { InvoiceWithCommande } from "@/features/invoices/types"
import {
  ArrowLeft, Download, Share2, Mail, Edit3, ChevronDown,
  FileText, Receipt, RefreshCw, Calendar, User, Hash,
  FileInput, Copy, Send, Trash2, MoreHorizontal, Loader2,
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
  const typeIcon = invoice.type === "DEVIS"
    ? <FileText className="size-4 text-blue-500" strokeWidth={1.8} />
    : <Receipt className="size-4 text-[var(--gold-deep)]" strokeWidth={1.8} />
  const isQuote = invoice.type === "DEVIS"
  const showGenInvoice = isQuote && status !== "REJECTED"

  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />

      <div className="relative mx-auto max-w-[1360px] px-6 py-7 lg:px-10">
        <div className="animate-fade-in">
          <button
            onClick={() => router.push("/dashboard/invoices")}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="size-3.5" strokeWidth={1.8} />
            Retour aux documents
          </button>

          <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-8">
            <div className="min-w-0 space-y-7">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide shrink-0 ${st.color}`}>
                      <span className={`size-1.5 rounded-full ${st.dot}`} />
                      {typeLabel} · {st.label}
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md font-mono">
                      {invoice.number}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground mt-1">
                    {client && (
                      <span className="inline-flex items-center gap-1.5">
                        <User className="size-3.5" strokeWidth={1.5} />
                        {client.company ?? client.name}
                      </span>
                    )}
                    {invoice.commande && (
                      <span className="inline-flex items-center gap-1.5">
                        <Hash className="size-3.5" strokeWidth={1.5} />
                        {invoice.commande.number}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="size-3.5" strokeWidth={1.5} />
                      {new Date(invoice.issueDate).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[2rem] sm:text-[2.75rem] leading-[1.1] font-display font-bold text-foreground tracking-tight tabular-nums">
                {mad(invoice.totalAmount)}
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <ActionButton
                  icon={downloading ? <Loader2 className="size-3.5 animate-spin" strokeWidth={1.8} /> : <Download className="size-3.5" strokeWidth={1.8} />}
                  label={downloading ? "Téléchargement..." : "Télécharger"}
                  onClick={handleDownload}
                  disabled={downloading}
                  aria-busy={downloading}
                />
                <ActionButton
                  icon={<Send className="size-3.5" strokeWidth={1.8} />}
                  label="Envoyer"
                  disabled
                  title="Bientôt disponible"
                />
                {showGenInvoice && (
                  <ActionButton
                    icon={<FileInput className="size-3.5" strokeWidth={1.8} />}
                    label="Générer la facture"
                    disabled
                    title="Bientôt disponible"
                  />
                )}
                <ActionButton
                  icon={<Copy className="size-3.5" strokeWidth={1.8} />}
                  label="Dupliquer"
                  disabled
                  title="Bientôt disponible"
                />
                <ActionButton
                  icon={<Trash2 className="size-3.5" strokeWidth={1.8} />}
                  label="Supprimer"
                  disabled
                  title="Bientôt disponible"
                  variant="danger"
                />
                <div className="relative">
                  <button
                    onClick={() => setShowStatusDropdown((v) => !v)}
                    disabled={updating}
                    className={`inline-flex items-center gap-1.5 min-h-[44px] md:min-h-0 md:h-8 px-3 rounded-lg text-xs font-medium transition-all border border-border hover:bg-muted/40 disabled:opacity-50 ${st.color.split(" ").slice(0, 3).join(" ")}`}
                  >
                    {updating
                      ? <RefreshCw className="size-3 animate-spin" strokeWidth={1.5} />
                      : <span className={`size-1.5 rounded-full ${st.dot}`} />
                    }
                    {st.label}
                    <ChevronDown className="size-3" strokeWidth={1.5} />
                  </button>
                  {showStatusDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowStatusDropdown(false)} />
                      <div className="absolute left-0 top-full mt-1 z-20 w-44 rounded-xl border border-border bg-card shadow-lg py-1">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleStatusChange(opt.value)}
                            className="w-full text-left px-4 py-2 text-xs font-medium text-foreground hover:bg-muted/40 transition-colors"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border/20 rounded-xl overflow-hidden">
                <InfoCard title="Client">
                  {client ? (
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-foreground">{client.company ?? client.name}</p>
                      {client.email && <p className="text-xs text-muted-foreground">{client.email}</p>}
                      {client.phone && <p className="text-xs text-muted-foreground">{client.phone}</p>}
                      {client.address && <p className="text-xs text-muted-foreground">{client.address}</p>}
                      {(client.city || client.postalCode) && (
                        <p className="text-xs text-muted-foreground">{client.city}{client.postalCode ? ` ${client.postalCode}` : ""}</p>
                      )}
                      {client.siret && <p className="text-xs text-muted-foreground mt-1">SIRET: {client.siret}</p>}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/60">—</p>
                  )}
                </InfoCard>

                <InfoCard title="Commande / Événement">
                  {invoice.commande ? (
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-foreground">{invoice.commande.number}</p>
                      {event?.name && <p className="text-xs text-muted-foreground">{event.name}</p>}
                      {event?.startDate && <p className="text-xs text-muted-foreground">{new Date(event.startDate).toLocaleDateString("fr-FR")}</p>}
                      {event?.location && <p className="text-xs text-muted-foreground">{event.location}</p>}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/60">—</p>
                  )}
                </InfoCard>

                <InfoCard title="Document">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Émission</span>
                      <span className="text-xs font-medium text-foreground">{new Date(invoice.issueDate).toLocaleDateString("fr-FR")}</span>
                    </div>
                    {invoice.dueDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Échéance</span>
                        <span className="text-xs font-medium text-foreground">{new Date(invoice.dueDate).toLocaleDateString("fr-FR")}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Type</span>
                      <span className="text-xs font-medium text-foreground">{typeLabel}</span>
                    </div>
                  </div>
                </InfoCard>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 bg-card border border-border rounded-xl overflow-hidden">
                <Metric label="Total" value={mad(invoice.totalAmount)} className="text-foreground" />
                <Metric label="Acompte" value={invoice.commande?.acompteAmount ? mad(invoice.commande.acompteAmount) : "—"} className="text-muted-foreground" />
                <Metric label="Payé" value={mad(invoice.paidAmount)} className="text-emerald-600" />
                <Metric
                  label="Restant"
                  value={remaining > 0 ? mad(remaining) : "Soldé"}
                  className={remaining > 0 ? "text-amber-600" : "text-emerald-600"}
                />
              </div>

              {invoice.commande?.items && invoice.commande.items.length > 0 && (
                <section>
                  <h2 className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-semibold mb-3">Articles</h2>
                  <div className="bg-card border border-border rounded-xl overflow-x-auto">
                    <div className="max-h-[420px] overflow-y-auto min-w-[560px]">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/30 bg-muted/30 sticky top-0 z-10">
                            <th className="text-left text-[11px] uppercase tracking-[0.06em] text-muted-foreground font-semibold px-5 py-3.5 w-auto">Article</th>
                            <th className="text-right text-[11px] uppercase tracking-[0.06em] text-muted-foreground font-semibold px-4 py-3.5 w-24">Quantité</th>
                            <th className="text-right text-[11px] uppercase tracking-[0.06em] text-muted-foreground font-semibold px-4 py-3.5 w-32">Prix unitaire</th>
                            <th className="text-right text-[11px] uppercase tracking-[0.06em] text-muted-foreground font-semibold px-5 py-3.5 w-32">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                          {invoice.commande.items.map((item, idx) => (
                            <tr
                              key={item.id}
                              className={`hover:bg-muted/20 transition-colors ${idx % 2 === 1 ? "bg-muted/15" : ""}`}
                            >
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

              {(invoice.notes || invoice.commande?.clientNotes || invoice.commande?.discountAmount) && (
                <section>
                  <h2 className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-semibold mb-3">Informations complémentaires</h2>
                  <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                    {invoice.notes && (
                      <div>
                        <h3 className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground font-medium mb-1.5">Notes</h3>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{invoice.notes}</p>
                      </div>
                    )}
                    {!invoice.notes && invoice.commande?.clientNotes && (
                      <div>
                        <h3 className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground font-medium mb-1.5">Notes client</h3>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{invoice.commande.clientNotes}</p>
                      </div>
                    )}
                    {invoice.commande?.discountAmount != null && invoice.commande.discountAmount > 0 && (
                      <div className="flex items-center gap-3 px-4 py-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                        <span className="text-[11px] uppercase tracking-[0.06em] text-emerald-600 font-semibold">Remise</span>
                        <span className="text-sm font-semibold text-emerald-600">-{mad(invoice.commande.discountAmount)}</span>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>

            <div className="hidden lg:block">
              <div className="sticky top-[100px]">
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-border/30">
                    <h3 className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-semibold">Résumé</h3>
                  </div>

                  <div className="px-5 py-4 border-b border-border/30">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-muted-foreground">Statut</span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${st.color}`}>
                        <span className={`size-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Total</span>
                        <span className="text-sm font-bold text-foreground tabular-nums">{mad(invoice.totalAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Payé</span>
                        <span className="text-xs font-medium text-emerald-600 tabular-nums">{mad(invoice.paidAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Restant</span>
                        <span className={`text-xs font-medium tabular-nums ${remaining > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                          {remaining > 0 ? mad(remaining) : "Soldé"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-4 border-b border-border/30">
                    <h4 className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground font-medium mb-2">Dates</h4>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Émission</span>
                        <span className="text-xs font-medium text-foreground">{new Date(invoice.issueDate).toLocaleDateString("fr-FR")}</span>
                      </div>
                      {invoice.dueDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Échéance</span>
                          <span className="text-xs font-medium text-foreground">{new Date(invoice.dueDate).toLocaleDateString("fr-FR")}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-5 py-4 space-y-2">
                    <h4 className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground font-medium mb-2">Actions</h4>
                    <button
                      onClick={handleDownload}
                      className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] md:min-h-0 md:h-9 px-4 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted/40 transition-all"
                    >
                      <Download className="size-3.5" strokeWidth={1.8} />
                      Télécharger le PDF
                    </button>
                    <button
                      disabled
                      title="Bientôt disponible"
                      className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] md:min-h-0 md:h-9 px-4 rounded-lg border border-border text-xs font-medium text-foreground/40 cursor-not-allowed transition-all"
                    >
                      <Send className="size-3.5" strokeWidth={1.8} />
                      Envoyer par email
                    </button>
                    <button
                      disabled
                      title="Bientôt disponible"
                      className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] md:min-h-0 md:h-9 px-4 rounded-lg border border-red-500/20 text-xs font-medium text-red-500/50 cursor-not-allowed transition-all"
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.8} />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </div>
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

function ActionButton({
  icon, label, onClick, disabled, title, variant, 'aria-busy': ariaBusy,
}: {
  icon: React.ReactNode; label: string; onClick?: () => void; disabled?: boolean; title?: string; variant?: "danger"; 'aria-busy'?: boolean
}) {
  const base = "inline-flex items-center gap-1.5 min-h-[44px] md:min-h-0 md:h-8 px-3 rounded-lg text-xs font-medium transition-all border"
  if (disabled) {
    return (
      <button disabled title={title} className={`${base} border-border text-muted-foreground/40 cursor-not-allowed`} aria-busy={ariaBusy} aria-disabled={disabled}>
        {icon}{label}
      </button>
    )
  }
  if (variant === "danger") {
    return (
      <button onClick={onClick} className={`${base} border-red-500/20 text-red-600 hover:bg-red-500/5`}>
        {icon}{label}
      </button>
    )
  }
  return (
    <button onClick={onClick} className={`${base} border-border text-foreground hover:bg-muted/40 hover:border-foreground/20`}>
      {icon}{label}
    </button>
  )
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card px-5 py-4">
      <h3 className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-semibold mb-2.5">{title}</h3>
      {children}
    </div>
  )
}

function Metric({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="px-5 py-4 border-r border-border/50 last:border-r-0">
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <p className={`text-base font-bold tabular-nums ${className ?? ""}`}>{value}</p>
    </div>
  )
}
