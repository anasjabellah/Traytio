"use client"

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Trash2, Calendar, MapPin, Users, Wallet,
  Sparkles, FileText, PartyPopper, CheckCircle2,
  Phone, Mail, ChevronRight, User,
  ShoppingBag, Hash, Tag, Clock, Package,
  Receipt, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteCommandeDialog } from "@/features/commandes/components/delete-commande-dialog";
import type { CommandeWithDetails } from "@/features/commandes/types";

const mad = (n: number) =>
  new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(n);

const TYPE_LABELS: Record<string, string> = {
  WEDDING: "Mariage", CORPORATE: "Entreprise", BIRTHDAY: "Anniversaire",
  ANNIVERSARY: "Cocktail", HOLIDAY: "Gala", OTHER: "Privé",
};

const EVENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon", PLANNED: "Planifié", CONFIRMED: "Confirmé",
  IN_PROGRESS: "En cours", COMPLETED: "Terminé", CANCELLED: "Annulé",
};

const EVENT_STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-200 text-gray-800 ring-1 ring-gray-300/60",
  PLANNED: "bg-blue-100 text-blue-800 ring-1 ring-blue-300/60",
  CONFIRMED: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/60",
  IN_PROGRESS: "bg-amber-100 text-amber-800 ring-1 ring-amber-300/60",
  COMPLETED: "bg-emerald-800 text-white ring-1 ring-emerald-900/60",
  CANCELLED: "bg-red-100 text-red-800 ring-1 ring-red-300/60",
};

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
});

const NOTE_TABS = ["Internes", "Client", "Générales"] as const;

export default function CommandeDetailView({ commande }: { commande: CommandeWithDetails }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeNoteTab, setActiveNoteTab] = useState<string>("Internes");

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

        {/* ═══ HERO HEADER ═══ */}
        <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-7">
          <div className="flex items-start gap-4">
            <Link
              href="/dashboard/commandes"
              className="mt-1 size-10 rounded-xl border border-border bg-white/50 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-soft shrink-0"
            >
              <ArrowLeft className="size-4 text-foreground/70" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-foreground/60 font-semibold mb-1.5">
                <ShoppingBag className="size-3" strokeWidth={2.5} />
                Détail commande
              </div>
              <h1 className="font-display text-3xl lg:text-4xl text-gradient-charcoal leading-[1.1]">
                {commande.number}
              </h1>
              <div className="flex flex-wrap items-center gap-2.5 mt-3">
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${EVENT_STATUS_STYLES[commande.event?.status ?? ''] || "bg-gray-100 text-gray-500"}`}>
                  {commande.event?.status ? (EVENT_STATUS_LABELS[commande.event.status] || commande.event.status) : "Aucun événement"}
                </span>
                {commande.eventType && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-50/80 text-amber-800 border border-amber-200/50">
                    {TYPE_LABELS[commande.eventType] || commande.eventType}
                  </span>
                )}
                <span className="text-xs text-foreground/85 flex items-center gap-1.5 font-medium">
                  <Calendar className="size-3 text-foreground/60" strokeWidth={1.8} />
                  {formatShort(commande.eventDate) ?? "Date non définie"}
                </span>
                {commande.clientName && (
                  <span className="text-xs text-foreground/85 flex items-center gap-1.5 font-medium">
                    <Users className="size-3 text-foreground/60" strokeWidth={1.8} />
                    {commande.clientName}
                  </span>
                )}
                {commande.guestCount && (
                  <span className="text-xs text-foreground/80 flex items-center gap-1.5 font-medium">
                    <Users className="size-3 text-foreground/60" strokeWidth={1.8} />
                    {commande.guestCount} invités
                  </span>
                )}
                <span className="text-[11px] text-foreground/50 ml-1.5 border-l border-border/30 pl-3">
                  Créée le {formatShort(commande.createdAt) ?? "—"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {commande.pdfUrl && (
              <a
                href={commande.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-white/50 backdrop-blur-sm hover:bg-white transition-colors shadow-soft text-xs font-medium text-foreground/80"
              >
                <Download className="size-3.5" strokeWidth={1.8} />
                PDF
              </a>
            )}
            <Link
              href={`/dashboard/commandes/${commande.id}/edit`}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-white/50 backdrop-blur-sm hover:bg-white transition-colors shadow-soft text-xs font-medium text-foreground/80"
            >
              <Pencil className="size-3.5" strokeWidth={1.8} />
              Modifier
            </Link>
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-xl border-border shadow-soft bg-white/50 backdrop-blur-sm text-foreground/70 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-3.5" strokeWidth={1.8} />
            </Button>
          </div>
        </motion.div>

        {/* ═══ KPI CARDS ═══ */}
        <motion.div {...fadeUp(0.04)} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
          <KpiCard icon={Wallet} label="Total" value={mad(total)} accent />
          <KpiCard icon={CheckCircle2} label="Payé" value={paid > 0 ? mad(paid) : "0 MAD"} />
          <KpiCard icon={Clock} label="Reste" value={remaining > 0 ? mad(remaining) : "Soldé"} />
          <KpiCard icon={Users} label="Invités" value={commande.guestCount ? `${commande.guestCount}` : "—"} />
        </motion.div>

        {/* ═══ CONTENT GRID ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* ROW 1: Commande Info + Client */}
          <motion.div {...fadeUp(0.08)} className="rounded-2xl border border-border bg-card shadow-soft p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="size-7 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
                <FileText className="size-3.5 text-foreground/70" strokeWidth={1.8} />
              </div>
              <h4 className="font-display text-sm font-semibold text-foreground">Commande</h4>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
              <DetailRow label="Référence" value={commande.number} />
              <DetailRow label="Date" value={formatDate(commande.eventDate) ?? "—"} />
              <DetailRow label="Menu" value={commande.menuName || "—"} />
              <DetailRow label="Type" value={commande.eventType ? (TYPE_LABELS[commande.eventType] || commande.eventType) : "—"} />
              <DetailRow label="Invités" value={commande.guestCount ? `${commande.guestCount} pax` : "—"} />
              <DetailRow label="Lieu" value={commande.location || "—"} />
            </div>
          </motion.div>

          {commande.client && (
            <motion.div {...fadeUp(0.1)} className="rounded-2xl border border-border bg-card shadow-soft p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="size-7 rounded-lg bg-[var(--gold-soft)]/20 flex items-center justify-center">
                  <ShoppingBag className="size-3.5 text-[var(--gold-deep)]" strokeWidth={1.8} />
                </div>
                <h4 className="font-display text-sm font-semibold text-foreground">Client</h4>
              </div>
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-gradient-to-br from-[var(--gold-soft)] to-[var(--gold-deep)]/20 flex items-center justify-center text-sm font-semibold text-[var(--gold-foreground)] shrink-0 shadow-sm ring-2 ring-white">
                  {commande.client.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold truncate">{commande.client.name}</div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground/70 mt-1">
                    {commande.client.phone && (
                      <a href={`tel:${commande.client.phone}`} className="hover:text-foreground transition-colors flex items-center gap-1.5">
                        <Phone className="size-3" strokeWidth={1.8} />
                        {commande.client.phone}
                      </a>
                    )}
                    {commande.client.email && (
                      <a href={`mailto:${commande.client.email}`} className="hover:text-foreground transition-colors flex items-center gap-1.5">
                        <Mail className="size-3" strokeWidth={1.8} />
                        {commande.client.email}
                      </a>
                    )}
                  </div>
                  <Link href={`/dashboard/clients/${commande.client.id}`} className="text-[11px] text-[var(--gold-deep)] hover:underline inline-flex items-center gap-0.5 mt-1.5">
                    Voir profil <ChevronRight className="size-2.5" strokeWidth={2} />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* ROW 2: Événement + Paiement */}
          {commande.event && (
            <motion.div {...fadeUp(0.12)} className="rounded-2xl border border-border bg-card shadow-soft p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="size-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <PartyPopper className="size-3.5 text-blue-600" strokeWidth={1.8} />
                </div>
                <h4 className="font-display text-sm font-semibold text-foreground">Événement</h4>
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-base font-semibold truncate">{commande.event.name}</div>
                  {commande.event.status && (
                    <span className={`inline-block mt-1.5 text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${EVENT_STATUS_STYLES[commande.event.status] || "bg-gray-100 text-gray-500"}`}>
                      {EVENT_STATUS_LABELS[commande.event.status] || commande.event.status}
                    </span>
                  )}
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
                    {commande.event.startDate && (
                      <div className="flex items-center gap-1.5 text-xs text-foreground/70">
                        <Calendar className="size-3 shrink-0 text-foreground/60" strokeWidth={1.8} />
                        {formatDate(commande.event.startDate)}
                      </div>
                    )}
                    {commande.event.type && (
                      <div className="flex items-center gap-1.5 text-xs text-foreground/70">
                        <Tag className="size-3 shrink-0 text-foreground/60" strokeWidth={1.8} />
                        {TYPE_LABELS[commande.event.type] || commande.event.type}
                      </div>
                    )}
                    {commande.event.location && (
                      <div className="flex items-center gap-1.5 text-xs text-foreground/70">
                        <MapPin className="size-3 shrink-0 text-foreground/60" strokeWidth={1.8} />
                        {commande.event.location}
                      </div>
                    )}
                    {commande.event.guestCount && (
                      <div className="flex items-center gap-1.5 text-xs text-foreground/70">
                        <Users className="size-3 shrink-0 text-foreground/60" strokeWidth={1.8} />
                        {commande.event.guestCount} invités
                      </div>
                    )}
                  </div>
                </div>
                <Link href={`/dashboard/events/${commande.event.id}`} className="text-[11px] text-[var(--gold-deep)] hover:underline whitespace-nowrap shrink-0 mt-1 flex items-center gap-0.5">
                  Voir <ChevronRight className="size-2.5" strokeWidth={2} />
                </Link>
              </div>
              {(commande.event.contactPerson || commande.event.contactPhone) && (
                <>
                  <div className="border-t border-dashed border-border/40 my-3" />
                  <div className="space-y-2">
                    {commande.event.contactPerson && (
                      <div className="flex items-center gap-1.5 text-xs text-foreground/70">
                        <User className="size-3 shrink-0 text-foreground/60" strokeWidth={1.8} />
                        <span className="text-foreground/50 text-[10px] uppercase tracking-wider mr-1">Personne de contact</span>
                        {commande.event.contactPerson}
                      </div>
                    )}
                    {commande.event.contactPhone && (
                      <div className="flex items-center gap-1.5 text-xs text-foreground/70">
                        <Phone className="size-3 shrink-0 text-foreground/60" strokeWidth={1.8} />
                        <span className="text-foreground/50 text-[10px] uppercase tracking-wider mr-1">Téléphone contact</span>
                        {commande.event.contactPhone}
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}

          <motion.div {...fadeUp(0.14)} className="rounded-2xl border border-border bg-card shadow-soft p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="size-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="size-3.5 text-emerald-600" strokeWidth={1.8} />
              </div>
              <h4 className="font-display text-sm font-semibold text-foreground">Paiement</h4>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground/70">Total</span>
                <span className="font-semibold tabular-nums text-foreground">{mad(total)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground/70">Payé</span>
                <span className="font-semibold tabular-nums text-emerald-600">{mad(paid)}</span>
              </div>
              <div className="border-t border-dashed border-border/40" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground/70">Reste</span>
                <span className={`font-semibold tabular-nums ${remaining > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {remaining > 0 ? mad(remaining) : 'Soldé ✓'}
                </span>
              </div>
              {total > 0 && (
                <div className="pt-1.5">
                  <div className="flex items-center justify-between text-[11px] text-foreground/60 mb-1">
                    <span>Progression</span>
                    <span className="font-semibold text-foreground">{paidPct}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-emerald-100 to-emerald-200/60 overflow-hidden ring-1 ring-inset ring-emerald-200/30">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 transition-all shadow-sm"
                      style={{ width: `${Math.min(paidPct, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* ROW 3: Articles (full width) */}
          {commande.items && commande.items.length > 0 && (
            <motion.div {...fadeUp(0.16)} className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 pt-5 pb-0">
                <div className="size-7 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
                <Receipt className="size-3.5 text-foreground/70" strokeWidth={1.8} />
              </div>
              <h4 className="font-display text-sm font-semibold text-foreground">Articles</h4>
              <span className="text-xs text-foreground/60 ml-auto">{commande.items.length} article{commande.items.length > 1 ? 's' : ''}</span>
              </div>
              <div className="overflow-x-auto mt-4">
                <table className="w-full">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-t border-border/20 bg-muted/20">
                      <th className="text-left text-[11px] uppercase tracking-[0.08em] text-foreground/60 font-semibold px-5 py-3">Article</th>
                      <th className="text-center text-[11px] uppercase tracking-[0.08em] text-foreground/60 font-semibold px-3 py-3 w-[55px]">Qté</th>
                      <th className="text-right text-[11px] uppercase tracking-[0.08em] text-foreground/60 font-semibold px-3 py-3 w-[110px]">Prix unit.</th>
                      <th className="text-right text-[11px] uppercase tracking-[0.08em] text-amber-700/80 font-semibold px-5 py-3 w-[120px]">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/5">
                    {commande.items.map((item, i) => (
                      <tr
                        key={item.id}
                        className={`transition-colors hover:bg-amber-50/20 ${i % 2 === 0 ? 'bg-white/40' : 'bg-foreground/[0.01]'}`}
                      >
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-medium">{item.name}</span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="text-sm tabular-nums text-foreground font-medium">{item.quantity}</span>
                        </td>
                        <td className="px-3 py-3.5 text-right">
                          <span className="text-sm tabular-nums text-foreground/70">{mad(Number(item.unitPrice))}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-sm font-bold tabular-nums text-amber-700">{mad(Number(item.totalPrice))}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ROW 4: Résumé financier + Activité */}
          <motion.div {...fadeUp(0.18)} className="rounded-2xl border border-[var(--gold-soft)]/40 bg-gradient-to-br from-amber-50/40 to-white shadow-soft p-5 relative overflow-hidden">
            <div className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-gradient-gold opacity-[0.07] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 size-28 rounded-full bg-gradient-gold opacity-[0.05] blur-3xl" />
            <div className="flex items-center gap-2.5 mb-4">
              <div className="size-7 rounded-lg bg-gradient-gold text-[var(--gold-foreground)] flex items-center justify-center">
                <Wallet className="size-3.5" strokeWidth={1.8} />
              </div>
              <h4 className="font-display text-sm font-semibold text-[var(--gold-deep)]">Résumé financier</h4>
            </div>
            <div className="space-y-2">
              <FinRow label="Sous-total articles" value={mad(itemsSubtotal)} />
              {(commande.transportFees ?? 0) > 0 && <FinRow label="Transport" value={mad(Number(commande.transportFees ?? 0))} />}
              {(commande.deliveryFees ?? 0) > 0 && <FinRow label="Livraison" value={mad(Number(commande.deliveryFees ?? 0))} />}
              {(commande.equipmentFees ?? 0) > 0 && <FinRow label="Équipement" value={mad(Number(commande.equipmentFees ?? 0))} />}
              {totalFees > 0 && <FinRow label="Total frais" value={mad(totalFees)} />}
              {discountAmount > 0 && (
                <FinRow label={`Remise ${isDiscountPercentage ? `(${Number(commande.discountValue ?? 0)}%)` : ""}`} value={`-${mad(discountAmount)}`} className="text-emerald-600" />
              )}
              <div className="border-t border-dashed border-amber-200/50" />
              <div className="flex items-center justify-between py-1">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <span className="font-display text-xl text-gradient-charcoal tabular-nums">{mad(total)}</span>
              </div>
              <div className="border-t border-dashed border-amber-200/50" />
              <FinRow label="Payé" value={mad(paid)} muted />
              <FinRow label="Reste" value={mad(remaining)} muted />
              {total > 0 && (
                <div className="pt-1.5">
                  <div className="flex items-center justify-between text-[11px] text-foreground/60 mb-1">
                    <span>Progression</span>
                    <span className="font-semibold text-foreground">{paidPct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gradient-to-r from-amber-100 to-amber-200/60 overflow-hidden ring-1 ring-inset ring-amber-200/30">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-[var(--gold-deep)] transition-all shadow-sm" style={{ width: `${Math.min(paidPct, 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.2)} className="rounded-2xl border border-border bg-card shadow-soft p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="size-7 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
                <Sparkles className="size-3.5 text-foreground/70" strokeWidth={1.8} />
              </div>
              <h4 className="font-display text-sm font-semibold text-foreground">Activité</h4>
              <span className="text-xs text-foreground/60 ml-auto">{activities.length} événement{activities.length > 1 ? 's' : ''}</span>
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

          {/* ROW 5: Notes with tabs */}
          {hasNotes && (
            <motion.div {...fadeUp(0.22)} className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-soft p-5">
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
                <div className="text-xs text-foreground/60 italic py-3">Aucune note</div>
              )}
            </motion.div>
          )}

          {/* Menu Card (inline if no notes) */}
          {commande.menu && !hasNotes && (
            <motion.div {...fadeUp(0.24)} className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-soft p-5">
              <div className="flex items-center gap-2.5">
                <div className="size-7 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
                  <Package className="size-3.5 text-foreground/70" strokeWidth={1.8} />
                </div>
                <h4 className="font-display text-sm font-semibold text-foreground">Menu</h4>
                <span className="text-base text-foreground ml-auto">{commande.menu.name}</span>
              </div>
            </motion.div>
          )}

        </div>

        {/* Footer */}
        <footer className="mt-10 mb-6 flex items-center justify-between text-[11px] text-foreground/50">
          <div className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            Créée le {formatDate(commande.createdAt) ?? "—"} · Mise à jour le {formatDate(commande.updatedAt) ?? "—"}
          </div>
          <div>© TUR</div>
        </footer>
      </div>

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

function KpiCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: boolean }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`group relative overflow-hidden rounded-2xl border p-5 shadow-soft transition-all hover:shadow-lift ${accent ? "border-[var(--gold-soft)] bg-gradient-to-br from-amber-50/30 to-white" : "border-border bg-card"}`}
    >
      {accent && (
        <>
          <div className="pointer-events-none absolute -top-16 -right-16 size-36 rounded-full bg-gradient-gold opacity-15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 size-24 rounded-full bg-gradient-gold opacity-10 blur-3xl" />
        </>
      )}
      <div className="flex items-start justify-between mb-2">
        <span className={`text-[10px] uppercase tracking-[0.1em] font-semibold ${accent ? "text-[var(--gold-deep)]" : "text-foreground/70"}`}>{label}</span>
        <div className={`size-9 rounded-xl flex items-center justify-center shadow-sm ${accent ? "bg-gradient-gold text-[var(--gold-foreground)]" : "bg-foreground/[0.04] text-foreground/70"}`}>
          <Icon className="size-[18px]" strokeWidth={1.8} />
        </div>
      </div>
      <div className={`font-display text-2xl tabular-nums leading-tight ${accent ? "text-[var(--gold-deep)]" : "text-foreground"}`}>{value}</div>
    </motion.div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const isMissing = value === "—";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.08em] text-foreground/60 font-semibold min-w-[48px]">{label}</span>
      <span className={`text-sm truncate ${isMissing ? "text-foreground/50 italic" : "font-medium text-foreground"}`}>{value}</span>
    </div>
  );
}

function FinRow({ label, value, muted, className }: { label: string; value: string; muted?: boolean; className?: string }) {
  return (
    <div className={`flex items-center justify-between ${muted ? "text-foreground/70" : ""} ${className || ""}`}>
      <span className="text-xs">{label}</span>
      <span className="tabular-nums text-xs font-medium">{value}</span>
    </div>
  );
}
