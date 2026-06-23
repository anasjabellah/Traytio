"use client"

import { useMemo, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Pencil, Trash2, Calendar, MapPin, Users, Wallet,
  Sparkles, FileText, PartyPopper, CheckCircle2,
  Phone, Mail, ChevronRight, User,
  ShoppingBag, Hash, Tag, Clock, Package,
  Receipt, Download, Plus, FileDown, MessageCircle,
  Landmark, CreditCard, Ban, Loader2, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DeleteCommandeDialog } from "@/features/commandes/components/delete-commande-dialog";
import { PaymentCard } from "@/features/payments/components/payment-card";
import { AddPaymentDialog } from "@/features/payments/components/add-payment-dialog";
import { PaymentHistory } from "@/features/payments/components/payment-history";
import { createQuoteFromCommande, createInvoiceFromCommande, getInvoices } from "@/features/invoices/actions/invoice-actions";
import type { CommandeWithDetails } from "@/features/commandes/types";
import type { InvoiceWithCommande } from "@/features/invoices/types";

const mad = (n: number) =>
  new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(n);

const madFull = (n: number) =>
  new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 2 }).format(n);

const TYPE_LABELS: Record<string, string> = {
  WEDDING: "Mariage", CORPORATE: "Entreprise", BIRTHDAY: "Anniversaire",
  ANNIVERSARY: "Cocktail", HOLIDAY: "Gala", OTHER: "Privé",
};

const COMMANDE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon", QUOTED: "Devis", CONFIRMED: "Confirmée",
  IN_PROGRESS: "En cours", READY: "Prête", DELIVERED: "Livrée", CANCELLED: "Annulée",
};

const COMMANDE_STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 ring-1 ring-gray-300/50",
  QUOTED: "bg-blue-100 text-blue-700 ring-1 ring-blue-300/50",
  CONFIRMED: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300/50",
  IN_PROGRESS: "bg-amber-100 text-amber-700 ring-1 ring-amber-300/50",
  READY: "bg-violet-100 text-violet-700 ring-1 ring-violet-300/50",
  DELIVERED: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/50",
  CANCELLED: "bg-red-100 text-red-700 ring-1 ring-red-300/50",
};

const EVENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon", PLANNED: "Planifié", CONFIRMED: "Confirmé",
  IN_PROGRESS: "En cours", COMPLETED: "Terminé", CANCELLED: "Annulé",
};

const EVENT_STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600 ring-1 ring-gray-200/50",
  PLANNED: "bg-blue-100 text-blue-700 ring-1 ring-blue-200/50",
  CONFIRMED: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/50",
  IN_PROGRESS: "bg-amber-100 text-amber-700 ring-1 ring-amber-200/50",
  COMPLETED: "bg-gray-200 text-gray-700 ring-1 ring-gray-300/50",
  CANCELLED: "bg-red-100 text-red-700 ring-1 ring-red-200/50",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Impayé", PARTIALLY_PAID: "Partiellement payé",
  DEPOSIT_PAID: "Acompte versé", PAID: "Payé", REFUNDED: "Remboursé",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  UNPAID: "bg-red-50 text-red-700 ring-1 ring-red-200/50",
  PARTIALLY_PAID: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50",
  DEPOSIT_PAID: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/50",
  PAID: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50",
  REFUNDED: "bg-gray-100 text-gray-600 ring-1 ring-gray-200/50",
};

const METHOD_BADGES: Record<string, { label: string; icon: typeof CreditCard; style: string }> = {
  CASH: { label: "Espèces", icon: Wallet, style: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50" },
  CARD: { label: "Carte", icon: CreditCard, style: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/50" },
  TRANSFER: { label: "Virement", icon: Landmark, style: "bg-violet-50 text-violet-700 ring-1 ring-violet-200/50" },
  CHECK: { label: "Chèque", icon: Receipt, style: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50" },
  OTHER: { label: "Autre", icon: Ban, style: "bg-gray-100 text-gray-600 ring-1 ring-gray-200/50" },
};

const NOTE_TABS = ["Internes", "Client", "Générales"] as const;

export default function CommandeDetailView({ commande }: { commande: CommandeWithDetails }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number | undefined>(undefined);
  const [activeNoteTab, setActiveNoteTab] = useState<string>("Internes");

  const [invoices, setInvoices] = useState<InvoiceWithCommande[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [generating, setGenerating] = useState<"quote" | "invoice" | null>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setInvoicesLoading(true);
      const result = await getInvoices({ commandeId: commande.id, limit: 50 });
      if (result.success) {
        setInvoices(result.data?.data ?? []);
      }
    } catch {
      // silent
    } finally {
      setInvoicesLoading(false);
    }
  }, [commande.id]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleGenerateQuote = useCallback(async () => {
    setGenerating("quote");
    try {
      const result = await createQuoteFromCommande(commande.id);
      if (result.success) {
        toast.success("Devis créé avec succès");
        await fetchInvoices();
      } else {
        toast.error(result.error ?? "Erreur lors de la création du devis");
      }
    } catch {
      toast.error("Erreur lors de la création du devis");
    } finally {
      setGenerating(null);
    }
  }, [commande.id, fetchInvoices]);

  const handleGenerateInvoice = useCallback(async () => {
    setGenerating("invoice");
    try {
      const result = await createInvoiceFromCommande(commande.id);
      if (result.success) {
        toast.success("Facture créée avec succès");
        await fetchInvoices();
      } else {
        toast.error(result.error ?? "Erreur lors de la création de la facture");
      }
    } catch {
      toast.error("Erreur lors de la création de la facture");
    } finally {
      setGenerating(null);
    }
  }, [commande.id, fetchInvoices]);

  const handleDownloadInvoice = useCallback(async (invoice: InvoiceWithCommande) => {
    try {
      const resp = await fetch(`/api/invoices/${invoice.id}/pdf`);
      if (!resp.ok) {
        const err = await resp.json();
        toast.error(err.error ?? "Erreur de téléchargement");
        return;
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erreur de téléchargement");
    }
  }, []);

  const handlePaymentChange = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleCollectDeposit = useCallback(() => {
    const remainingDeposit = commande.acompteAmount - commande.paidAmount;
    setDepositAmount(remainingDeposit > 0 ? remainingDeposit : undefined);
    setAddPaymentOpen(true);
  }, [commande.acompteAmount, commande.paidAmount]);

  const handleAddPaymentOpen = useCallback(() => {
    setDepositAmount(undefined);
    setAddPaymentOpen(true);
  }, []);

  const formatDate = (d: Date | string | null | undefined) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  };

  const formatShort = (d: Date | string | null | undefined) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  };

  const itemsSubtotal = (commande.items ?? []).reduce((s, i) => s + i.totalPrice, 0);
  const totalFees = (commande.transportFees ?? 0) + (commande.deliveryFees ?? 0) + (commande.equipmentFees ?? 0);
  const discountAmount = commande.discountAmount ?? 0;
  const isDiscountPercentage = commande.discountType === "PERCENTAGE";
  const total = commande.totalAmount;
  const paid = commande.paidAmount;
  const remaining = commande.remainingAmount;
  const paidPct = total > 0 ? Math.round((paid / total) * 100) : 0;

  const hasNotes = !!(commande.internalNotes || commande.clientNotes || commande.notes);

  const activeNoteContent = activeNoteTab === "Internes" ? commande.internalNotes
    : activeNoteTab === "Client" ? commande.clientNotes
    : commande.notes;

  const noteTabs = NOTE_TABS.filter(t =>
    t === "Internes" ? commande.internalNotes
    : t === "Client" ? commande.clientNotes
    : commande.notes
  );

  const activities = useMemo(() => {
    const items: Array<{ icon: typeof Sparkles; label: string; time?: string | null; color: string; bgColor: string }> = [
      { icon: Sparkles, label: "Commande créée", time: formatDate(commande.createdAt), color: "text-emerald-600", bgColor: "bg-emerald-100" },
    ];
    if (commande.updatedAt && new Date(commande.updatedAt).getTime() - new Date(commande.createdAt).getTime() > 1000) {
      items.push({
        icon: Pencil,
        label: "Informations mise à jour",
        time: formatDate(commande.updatedAt),
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      });
    }
    if (commande.activities && commande.activities.length > 0) {
      commande.activities.forEach((a) => {
        items.push({
          icon: FileText,
          label: a.description,
          time: formatDate(a.createdAt),
          color: "text-foreground/70",
          bgColor: "bg-foreground/[0.06]",
        });
      });
    }
    return items;
  }, [commande.createdAt, commande.updatedAt, commande.activities]);

  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />

      <div className="relative mx-auto max-w-[1520px] px-6 py-6 lg:px-10">

        {/* ═══════════════════════════════════════════════
            HERO HEADER — Premium command overview
        ═══════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
          className="mb-8"
        >
          {/* Top navigation row */}
          <div className="flex items-center justify-between mb-5">
            <Link
              href="/dashboard/commandes"
              className="inline-flex items-center gap-1.5 text-[13px] text-foreground/50 hover:text-foreground transition-colors font-medium"
            >
              <ArrowLeft className="size-4" strokeWidth={1.8} />
              Retour aux commandes
            </Link>

            <div className="flex items-center gap-2">
              {commande.pdfUrl && (
                <a href={commande.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border bg-white/60 hover:bg-white text-xs font-medium text-foreground/70 hover:text-foreground transition-all">
                  <Download className="size-3.5" strokeWidth={1.8} />
                  PDF
                </a>
              )}
              <Link href={`/dashboard/commandes/${commande.id}/edit`} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border bg-white/60 hover:bg-white text-xs font-medium text-foreground/70 hover:text-foreground transition-all">
                <Pencil className="size-3.5" strokeWidth={1.8} />
                Modifier
              </Link>
              <button onClick={() => setDeleteOpen(true)} className="size-9 rounded-lg border border-border bg-white/60 hover:bg-white text-foreground/50 hover:text-red-600 transition-all flex items-center justify-center">
                <Trash2 className="size-3.5" strokeWidth={1.8} />
              </button>
            </div>
          </div>

          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
            <div>
              <span className="text-[11px] uppercase tracking-[0.1em] text-foreground/50 font-semibold mb-1.5 block">
                Commande
              </span>
              <h1 className="font-display text-4xl lg:text-5xl text-gradient-charcoal leading-[1.05] tracking-tight">
                {commande.number}
              </h1>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className={`text-[11px] px-3 py-1 rounded-full font-semibold ${COMMANDE_STATUS_STYLES[commande.status] ?? "bg-gray-100 text-gray-500"}`}>
                {COMMANDE_STATUS_LABELS[commande.status] ?? commande.status}
              </span>
              {commande.eventType && (
                <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-amber-50/80 text-amber-800 border border-amber-200/50">
                  {TYPE_LABELS[commande.eventType] || commande.eventType}
                </span>
              )}
              {commande.eventDate && (
                <span className="text-[11px] text-foreground/60 flex items-center gap-1.5 font-medium bg-white/60 px-2.5 py-1 rounded-full border border-border/50">
                  <Calendar className="size-3 text-foreground/50" strokeWidth={1.8} />
                  {formatShort(commande.eventDate)}
                </span>
              )}
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.04, ease: [0.22, 1, 0.36, 1] as const }}
              className="group relative overflow-hidden rounded-2xl border border-gold bg-card p-5 shadow-soft hover:shadow-lift transition-all"
            >
              <div className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full bg-gradient-gold opacity-20 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Total</div>
                  <div className="mt-3 font-display text-4xl tabular-nums text-gradient-charcoal">{madFull(total)}</div>
                </div>
                <div className="size-10 rounded-xl flex items-center justify-center bg-gradient-gold text-[var(--gold-foreground)]">
                  <Wallet className="size-5" strokeWidth={1.8} />
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div className="text-xs text-muted-foreground/60">Montant total de la commande</div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] as const }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft hover:shadow-lift transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Payé</div>
                  <div className="mt-3 font-display text-4xl tabular-nums text-emerald-600">{madFull(paid)}</div>
                </div>
                <div className="size-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="size-5" strokeWidth={1.8} />
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div className="text-xs text-muted-foreground/60">Déjà encaissé</div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] as const }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft hover:shadow-lift transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Reste</div>
                  <div className={`mt-3 font-display text-4xl tabular-nums ${remaining > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    {remaining > 0 ? madFull(remaining) : "0 MAD"}
                  </div>
                </div>
                <div className={`size-10 rounded-xl flex items-center justify-center ${remaining > 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
                  <Clock className="size-5" strokeWidth={1.8} />
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                {remaining > 0 ? (
                  <div className="text-xs text-muted-foreground/60">En attente de paiement</div>
                ) : (
                  <div className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md text-emerald-700 bg-emerald-50">Commande soldée</div>
                )}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16, ease: [0.22, 1, 0.36, 1] as const }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft hover:shadow-lift transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Invités</div>
                  <div className="mt-3 font-display text-4xl tabular-nums text-gradient-charcoal">
                    {commande.guestCount ? `${commande.guestCount}` : "—"}
                  </div>
                </div>
                <div className="size-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                  <Users className="size-5" strokeWidth={1.8} />
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div className="text-xs text-muted-foreground/60">
                  {commande.guestCount ? `${commande.guestCount} personne${commande.guestCount > 1 ? "s" : ""}` : "Non renseigné"}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════
            MAIN LAYOUT — Content + Sticky Sidebar
        ═══════════════════════════════════════════════ */}
        <div className="flex gap-8 items-start">

          {/* ─── MAIN CONTENT ─── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* ─── ARTICLES TABLE ─── */}
            {commande.items && commande.items.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
                className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
              >
                <div className="px-6 pt-5 pb-0 flex items-center gap-3">
                  <div className="size-7 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
                    <Receipt className="size-3.5 text-foreground/70" strokeWidth={1.8} />
                  </div>
                  <h4 className="font-display text-sm font-semibold text-foreground">Articles</h4>
                  <span className="text-xs text-foreground/50 ml-auto">{commande.items.length} article{commande.items.length > 1 ? "s" : ""}</span>
                </div>
                <div className="overflow-x-auto mt-3">
                  <table className="w-full">
                    <thead>
                      <tr className="border-y border-border/20">
                        <th className="text-left text-[11px] uppercase tracking-[0.08em] text-foreground/50 font-semibold px-6 py-3">Article</th>
                        <th className="text-center text-[11px] uppercase tracking-[0.08em] text-foreground/50 font-semibold px-3 py-3 w-[70px]">Qté</th>
                        <th className="text-right text-[11px] uppercase tracking-[0.08em] text-foreground/50 font-semibold px-3 py-3 w-[120px]">Prix unit.</th>
                        <th className="text-right text-[11px] uppercase tracking-[0.08em] text-foreground/50 font-semibold px-6 py-3 w-[130px]">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/5">
                      {commande.items.map((item, i) => (
                        <tr key={item.id} className="transition-colors hover:bg-foreground/[0.02]">
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-foreground">{item.name}</span>
                          </td>
                          <td className="px-3 py-4 text-center">
                            <span className="text-sm tabular-nums text-foreground font-medium">{item.quantity}</span>
                          </td>
                          <td className="px-3 py-4 text-right">
                            <span className="text-sm tabular-nums text-foreground/60">{mad(Number(item.unitPrice))}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-bold tabular-nums text-foreground">{mad(Number(item.totalPrice))}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ─── INFORMATION SECTION (merged Client + Event) ─── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
              className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
            >
              <div className="px-6 pt-5 pb-4 border-b border-border/20">
                <div className="flex items-center gap-2.5">
                  <div className="size-7 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
                    <PartyPopper className="size-3.5 text-foreground/70" strokeWidth={1.8} />
                  </div>
                  <h4 className="font-display text-sm font-semibold text-foreground">Informations de l&apos;événement</h4>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Left column — Client */}
                <div className="p-6 border-r border-border/10">
                  <span className="text-[10px] uppercase tracking-[0.1em] text-foreground/50 font-semibold mb-3 block">Client</span>
                  {commande.client ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-gradient-to-br from-[var(--gold-soft)] to-[var(--gold-deep)]/20 flex items-center justify-center text-sm font-semibold text-[var(--gold-foreground)] shrink-0 shadow-sm ring-2 ring-white">
                          {commande.client.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">{commande.client.name}</div>
                          <Link href={`/dashboard/clients/${commande.client.id}`} className="text-[11px] text-[var(--gold-deep)] hover:underline inline-flex items-center gap-0.5 mt-0.5">
                            Voir profil <ChevronRight className="size-2.5" strokeWidth={2} />
                          </Link>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {commande.client.phone && (
                          <div className="flex items-center gap-2 text-xs text-foreground/70">
                            <Phone className="size-3 text-foreground/50" strokeWidth={1.8} />
                            {commande.client.phone}
                          </div>
                        )}
                        {commande.client.email && (
                          <div className="flex items-center gap-2 text-xs text-foreground/70">
                            <Mail className="size-3 text-foreground/50" strokeWidth={1.8} />
                            {commande.client.email}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-foreground/50 italic">Client non spécifié</div>
                  )}
                </div>

                {/* Right column — Event details */}
                <div className="p-6">
                  <span className="text-[10px] uppercase tracking-[0.1em] text-foreground/50 font-semibold mb-3 block">Événement</span>
                  <div className="grid grid-cols-1 gap-y-2.5">
                    {commande.eventDate && (
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="size-3 text-foreground/50 shrink-0" strokeWidth={1.8} />
                        <span className="text-foreground/80">{formatDate(commande.eventDate)}</span>
                      </div>
                    )}
                    {commande.eventType && (
                      <div className="flex items-center gap-2 text-xs">
                        <Tag className="size-3 text-foreground/50 shrink-0" strokeWidth={1.8} />
                        <span className="text-foreground/80">{TYPE_LABELS[commande.eventType] || commande.eventType}</span>
                      </div>
                    )}
                    {commande.guestCount && (
                      <div className="flex items-center gap-2 text-xs">
                        <Users className="size-3 text-foreground/50 shrink-0" strokeWidth={1.8} />
                        <span className="text-foreground/80">{commande.guestCount} invités</span>
                      </div>
                    )}
                    {commande.location && (
                      <div className="flex items-center gap-2 text-xs">
                        <MapPin className="size-3 text-foreground/50 shrink-0" strokeWidth={1.8} />
                        <span className="text-foreground/80">{commande.location}</span>
                      </div>
                    )}
                    {!commande.eventDate && !commande.eventType && !commande.guestCount && !commande.location && (
                      <div className="text-xs text-foreground/50 italic">Aucun détail événement</div>
                    )}
                  </div>
                  {commande.event && (
                    <div className="mt-3 pt-3 border-t border-border/10">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${EVENT_STATUS_STYLES[commande.event.status ?? ""] || "bg-gray-100 text-gray-500"}`}>
                          {EVENT_STATUS_LABELS[commande.event.status ?? ""] || commande.event.status}
                        </span>
                        {(commande.event.contactPerson || commande.event.contactPhone) && (
                          <span className="text-[10px] text-foreground/50">
                            {commande.event.contactPerson}{commande.event.contactPerson && commande.event.contactPhone ? " · " : ""}{commande.event.contactPhone}
                          </span>
                        )}
                        <Link href={`/dashboard/events/${commande.event.id}`} className="ml-auto text-[10px] text-[var(--gold-deep)] hover:underline inline-flex items-center gap-0.5">
                          Voir <ChevronRight className="size-2" strokeWidth={2} />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ─── PAYMENT + FINANCIAL SECTION ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <PaymentCard
                totalAmount={total}
                paidAmount={paid}
                remainingAmount={remaining}
                acompteAmount={commande.acompteAmount}
                paymentStatus={commande.paymentStatus}
                onAddPayment={handleAddPaymentOpen}
                onCollectDeposit={handleCollectDeposit}
              />

              {/* ─── FINANCIAL SUMMARY ─── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
                className="rounded-2xl border border-border bg-card shadow-soft p-5 relative overflow-hidden"
              >
                <div className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-gradient-gold opacity-[0.06] blur-3xl" />
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="size-7 rounded-lg bg-gradient-gold text-[var(--gold-foreground)] flex items-center justify-center">
                    <Wallet className="size-3.5" strokeWidth={1.8} />
                  </div>
                  <h4 className="font-display text-sm font-semibold text-foreground">Résumé financier</h4>
                </div>
                <div className="space-y-2">
                  <FinRow label="Sous-total articles" value={madFull(itemsSubtotal)} />
                  {(commande.transportFees ?? 0) > 0 && <FinRow label="Transport" value={madFull(Number(commande.transportFees ?? 0))} />}
                  {(commande.deliveryFees ?? 0) > 0 && <FinRow label="Livraison" value={madFull(Number(commande.deliveryFees ?? 0))} />}
                  {(commande.equipmentFees ?? 0) > 0 && <FinRow label="Équipement" value={madFull(Number(commande.equipmentFees ?? 0))} />}
                  {totalFees > 0 && <FinRow label="Total frais" value={madFull(totalFees)} />}
                  {discountAmount > 0 && (
                    <FinRow label={`Remise ${isDiscountPercentage ? `(${Number(commande.discountValue ?? 0)}%)` : ""}`} value={`-${madFull(discountAmount)}`} className="text-emerald-600" />
                  )}
                  <div className="border-t border-border/20 my-3" />
                  <FinRow label="Total" value={madFull(total)} className="font-semibold text-foreground" />
                  <FinRow label="Payé" value={madFull(paid)} muted />
                  <FinRow
                    label="Reste"
                    value={remaining > 0 ? madFull(remaining) : "Soldé ✓"}
                    className={`font-bold text-base ${remaining > 0 ? "text-amber-600" : "text-emerald-600"}`}
                  />
                </div>
              </motion.div>
            </div>

            {/* ─── PAYMENT HISTORY (timeline) ─── */}
            <PaymentHistory
              payments={commande.payments ?? []}
              onPaymentChange={handlePaymentChange}
            />

            {/* ─── NOTES ─── */}
            {hasNotes && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
                className="rounded-2xl border border-border bg-card shadow-soft p-5"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="size-7 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
                    <FileText className="size-3.5 text-foreground/70" strokeWidth={1.8} />
                  </div>
                  <h4 className="font-display text-sm font-semibold text-foreground">Notes</h4>
                </div>
                {noteTabs.length > 1 && (
                  <div className="flex items-center gap-1.5 mb-4">
                    {noteTabs.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveNoteTab(tab)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-[0.06em] transition-all ${
                          activeNoteTab === tab
                            ? "bg-foreground/[0.08] text-foreground shadow-sm"
                            : "text-foreground/60 hover:text-foreground/80 hover:bg-foreground/[0.03]"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                )}
                {activeNoteContent ? (
                  <div className="rounded-xl bg-foreground/[0.02] border border-border/30 p-4">
                    <p className="text-sm whitespace-pre-wrap text-foreground leading-relaxed">{activeNoteContent}</p>
                  </div>
                ) : (
                  <div className="text-xs text-foreground/50 italic py-3">Aucune note</div>
                )}
              </motion.div>
            )}

            {/* ─── ACTIVITY ─── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
              className="rounded-2xl border border-border bg-card shadow-soft p-5"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="size-7 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
                  <Sparkles className="size-3.5 text-foreground/70" strokeWidth={1.8} />
                </div>
                <h4 className="font-display text-sm font-semibold text-foreground">Activité</h4>
                <span className="text-xs text-foreground/50 ml-auto">{activities.length} événement{activities.length > 1 ? "s" : ""}</span>
              </div>
              <div className="relative">
                <div className="absolute left-[10px] top-2 bottom-2 w-px bg-border/40" />
                <div className="space-y-0">
                  {activities.map((a, i) => (
                    <div key={i} className="relative flex items-start gap-3.5 pb-3.5 last:pb-0">
                      <div className={`relative z-10 size-5 rounded-full ${a.bgColor} flex items-center justify-center shrink-0 mt-0.5 ring-2 ring-white`}>
                        <a.icon className={`size-2.5 ${a.color}`} strokeWidth={3} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-foreground">{a.label}</div>
                        {a.time && <div className="text-[11px] text-foreground/50 mt-0.5">{a.time}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ─── INVOICES / QUOTES HISTORY ─── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
              className="rounded-2xl border border-border bg-card shadow-soft p-5"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="size-7 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
                  <FileText className="size-3.5 text-foreground/70" strokeWidth={1.8} />
                </div>
                <h4 className="font-display text-sm font-semibold text-foreground">Devis & Factures</h4>
                <span className="text-xs text-foreground/50 ml-auto">{invoices.length} document{invoices.length > 1 ? "s" : ""}</span>
              </div>
              {invoicesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-foreground/40" strokeWidth={1.8} />
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-xs text-foreground/50 italic py-3">Aucun document généré</div>
              ) : (
                <div className="space-y-2">
                  {invoices.map((inv) => {
                    const typeLabel = inv.type === "DEVIS" ? "Devis" : "Facture";
                    return (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-foreground/[0.02] border border-border/30 p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground truncate">{inv.number}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${inv.status === "DRAFT" ? "bg-amber-50 text-amber-700" : inv.status === "SENT" ? "bg-blue-50 text-blue-700" : inv.status === "VIEWED" ? "bg-purple-50 text-purple-700" : inv.status === "ACCEPTED" ? "bg-emerald-50 text-emerald-700" : inv.status === "PAID" ? "bg-green-50 text-green-700" : inv.status === "OVERDUE" ? "bg-red-50 text-red-700" : inv.status === "REJECTED" ? "bg-rose-50 text-rose-700" : "bg-gray-100 text-gray-500"}`}>
                              {inv.status === "DRAFT" ? "Brouillon" : inv.status === "SENT" ? "Envoyé" : inv.status === "VIEWED" ? "Vu" : inv.status === "ACCEPTED" ? "Accepté" : inv.status === "PAID" ? "Payé" : inv.status === "OVERDUE" ? "En retard" : inv.status === "REJECTED" ? "Rejeté" : ""}
                            </span>
                          </div>
                          <div className="text-[11px] text-foreground/50 mt-0.5">
                            {typeLabel} · {new Date(inv.issueDate).toLocaleDateString("fr-FR")}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleDownloadInvoice(inv)}
                            className="size-8 rounded-lg border border-border bg-white hover:bg-foreground/[0.02] text-foreground/60 hover:text-foreground transition-all flex items-center justify-center"
                            title="Télécharger"
                          >
                            <Download className="size-3.5" strokeWidth={1.8} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

          </div>

          {/* ─── STICKY SIDEBAR ─── */}
          <motion.aside
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.14, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
            className="hidden lg:block w-[300px] shrink-0 sticky top-24"
          >
            <div className="space-y-4">

              {/* Status */}
              <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
                <span className="text-[10px] uppercase tracking-[0.1em] text-foreground/50 font-semibold block mb-3">Statut</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${COMMANDE_STATUS_STYLES[commande.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {COMMANDE_STATUS_LABELS[commande.status] ?? commande.status}
                  </span>
                  <span className={`text-xs px-2.5 py-1.5 rounded-full font-semibold ${PAYMENT_STATUS_STYLES[commande.paymentStatus ?? "UNPAID"] ?? "bg-gray-100 text-gray-500"}`}>
                    {PAYMENT_STATUS_LABELS[commande.paymentStatus ?? "UNPAID"] ?? commande.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Financial snapshot */}
              <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
                <span className="text-[10px] uppercase tracking-[0.1em] text-foreground/50 font-semibold block mb-3">Résumé</span>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground/60">Total</span>
                    <span className="text-sm font-semibold tabular-nums text-foreground">{madFull(total)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground/60">Payé</span>
                    <span className="text-sm font-semibold tabular-nums text-emerald-600">{madFull(paid)}</span>
                  </div>
                  <div className="border-t border-border/20 pt-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Reste</span>
                      <span className={`text-lg font-bold tabular-nums ${remaining > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                        {remaining > 0 ? madFull(remaining) : "Soldé ✓"}
                      </span>
                    </div>
                  </div>
                  {total > 0 && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-[10px] text-foreground/50 mb-1.5">
                        <span>Progression</span>
                        <span className="font-semibold text-foreground">{paidPct}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gradient-to-r from-emerald-100 to-emerald-200/60 overflow-hidden ring-1 ring-inset ring-emerald-200/30">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 transition-all shadow-sm"
                          style={{ width: `${paidPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
                <span className="text-[10px] uppercase tracking-[0.1em] text-foreground/50 font-semibold block mb-3">Actions</span>
                <div className="space-y-2">
                  <button
                    onClick={handleAddPaymentOpen}
                    className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-[var(--gold-deep)] hover:bg-[var(--gold-deep)]/90 text-white text-xs font-semibold transition-all shadow-sm"
                  >
                    <Plus className="size-3.5" strokeWidth={2.5} />
                    Ajouter un paiement
                  </button>
                  <button
                    onClick={handleGenerateQuote}
                    disabled={generating === "quote"}
                    className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl border border-border bg-white hover:bg-foreground/[0.02] text-xs font-medium text-foreground/70 hover:text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generating === "quote" ? <Loader2 className="size-3.5 animate-spin" strokeWidth={1.8} /> : <FileDown className="size-3.5" strokeWidth={1.8} />}
                    Générer un devis
                  </button>
                  <button
                    onClick={handleGenerateInvoice}
                    disabled={generating === "invoice"}
                    className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl border border-border bg-white hover:bg-foreground/[0.02] text-xs font-medium text-foreground/70 hover:text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generating === "invoice" ? <Loader2 className="size-3.5 animate-spin" strokeWidth={1.8} /> : <Receipt className="size-3.5" strokeWidth={1.8} />}
                    Générer une facture
                  </button>
                  <button
                    onClick={() => toast.info("Envoi WhatsApp — bientôt disponible")}
                    className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl border border-border bg-white hover:bg-foreground/[0.02] text-xs font-medium text-foreground/70 hover:text-foreground transition-all"
                  >
                    <MessageCircle className="size-3.5" strokeWidth={1.8} />
                    Envoyer par WhatsApp
                  </button>
                </div>
              </div>

            </div>
          </motion.aside>

        </div>

        {/* Footer */}
        <footer className="mt-12 mb-6 flex items-center justify-between text-[11px] text-foreground/50">
          <div className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            Créée le {formatDate(commande.createdAt) ?? "—"} · Mise à jour le {formatDate(commande.updatedAt) ?? "—"}
          </div>
          <div>© TUR — Suite traiteur premium</div>
        </footer>
      </div>

      <AddPaymentDialog
        open={addPaymentOpen}
        onOpenChange={(open) => { setAddPaymentOpen(open); if (!open) setDepositAmount(undefined); }}
        commandeId={commande.id}
        onSuccess={handlePaymentChange}
        defaultAmount={depositAmount}
      />

      <DeleteCommandeDialog
        commande={commande}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={() => { window.location.href = "/dashboard/commandes"; }}
      />
    </div>
  );
}

/* ---------------- Sub-components ---------------- */

function FinRow({ label, value, muted, className }: { label: string; value: string; muted?: boolean; className?: string }) {
  return (
    <div className={`flex items-center justify-between ${muted ? "text-foreground/60" : ""} ${className || ""}`}>
      <span className="text-xs">{label}</span>
      <span className="tabular-nums text-xs font-medium">{value}</span>
    </div>
  );
}
