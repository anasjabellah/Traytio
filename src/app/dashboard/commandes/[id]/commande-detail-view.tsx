"use client"

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Trash2, Calendar, MapPin, Users, Wallet,
  Sparkles, FileText, PartyPopper, CheckCircle2, Crown,
  Phone, Mail, ChevronRight, Receipt,
  ShoppingBag, Hash, Tag, Clock, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteCommandeDialog } from "@/features/commandes/components/delete-commande-dialog";
import { COMMANDE_STATUS_LABELS, COMMANDE_STATUS_STYLES } from "@/features/commandes/constants";
import type { CommandeWithDetails } from "@/features/commandes/types";

const mad = (n: number) =>
  new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(n);

const TYPE_LABELS: Record<string, string> = {
  WEDDING: "Mariage", CORPORATE: "Entreprise", BIRTHDAY: "Anniversaire",
  ANNIVERSARY: "Cocktail", HOLIDAY: "Gala", OTHER: "Privé",
};

export default function CommandeDetailView({ commande }: { commande: CommandeWithDetails }) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  const formatDate = (d: Date | string | null | undefined) => {
    if (!d) return "Non définie";
    return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  };

  const itemsSubtotal = (commande.items ?? []).reduce((s, i) => s + i.totalPrice, 0);
  const totalFees = (commande.transportFees ?? 0) + (commande.deliveryFees ?? 0) + (commande.equipmentFees ?? 0);
  const discountAmount = commande.discountAmount ?? 0;
  const isDiscountPercentage = commande.discountType === "PERCENTAGE";
  const total = commande.totalAmount;
  const paid = commande.paidAmount;
  const remaining = commande.remainingAmount;

  const activities = useMemo(() => {
    const items: Array<{ icon: typeof Sparkles; label: string; time?: string; color: string }> = [
      { icon: Sparkles, label: "Commande créée", time: formatDate(commande.createdAt), color: "text-emerald-600" },
    ];
    if (commande.updatedAt && new Date(commande.updatedAt).getTime() - new Date(commande.createdAt).getTime() > 1000) {
      items.push({
        icon: Pencil,
        label: "Informations mises à jour",
        time: formatDate(commande.updatedAt),
        color: "text-blue-600",
      });
    }
    if (commande.activities && commande.activities.length > 0) {
      commande.activities.forEach((a) => {
        items.push({
          icon: FileText,
          label: a.description,
          time: formatDate(a.createdAt),
          color: "text-muted-foreground",
        });
      });
    }
    return items;
  }, [commande.createdAt, commande.updatedAt, commande.activities]);

  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />

      <div className="relative mx-auto max-w-[1480px] px-6 py-8 lg:px-10">

        {/* ==================== HERO ==================== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-10"
        >
          <div className="flex items-start gap-4">
            <Link
              href="/dashboard/commandes"
              className="mt-2 size-10 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-foreground/[0.04] transition-colors shadow-soft shrink-0"
            >
              <ArrowLeft className="size-4 text-muted-foreground" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <ShoppingBag className="size-3 text-[var(--gold-deep)]" />
                <span>Détail de la commande</span>
              </div>
              <h1 className="font-display text-4xl lg:text-5xl text-gradient-charcoal leading-[1.05]">
                {commande.number}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`text-[11px] px-3 py-1 rounded-full font-medium ${COMMANDE_STATUS_STYLES[commande.status] || "bg-foreground/[0.05] text-muted-foreground"}`}>
                  {COMMANDE_STATUS_LABELS[commande.status] || commande.status}
                </span>
                {commande.eventType && (
                  <span className="text-[11px] px-3 py-1 rounded-full font-medium bg-foreground/[0.04] text-muted-foreground">
                    {TYPE_LABELS[commande.eventType] || commande.eventType}
                  </span>
                )}
                {commande.clientName && (
                  <span className="text-xs text-muted-foreground">
                    {commande.clientName}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/dashboard/commandes/${commande.id}/edit`}
              className="size-10 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-foreground/[0.04] transition-colors shadow-soft"
              title="Modifier"
            >
              <Pencil className="size-4 text-muted-foreground hover:text-foreground" />
            </Link>
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-xl border-border shadow-soft text-muted-foreground hover:text-red-600 hover:border-red-200 hover:bg-red-50"
              onClick={() => setDeleteOpen(true)}
              title="Supprimer"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </motion.div>

        {/* ==================== KPI CARDS ==================== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <KpiCard icon={Wallet} label="Total" value={mad(total)} accent />
          <KpiCard icon={CheckCircle2} label="Payé" value={paid > 0 ? mad(paid) : "0 MAD"} />
          <KpiCard icon={Clock} label="Reste" value={remaining > 0 ? mad(remaining) : "Soldé"} />
          <KpiCard icon={Users} label="Invités" value={commande.guestCount ? `${commande.guestCount} pax` : "Non renseigné"} />
        </motion.div>

        {/* ==================== MAIN GRID ==================== */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ---------- LEFT COLUMN (2/3) ---------- */}
          <div className="xl:col-span-2 space-y-6">

            {/* Commande Information */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border bg-card shadow-soft p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <FileText className="size-4 text-muted-foreground" />
                <h3 className="font-display text-xl">Informations</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <InfoItem icon={Hash} label="Référence" value={commande.number} />
                <InfoItem icon={Calendar} label="Date événement" value={formatDate(commande.eventDate)} />
                <InfoItem icon={MapPin} label="Lieu" value={commande.location || "Non renseigné"} />
                <InfoItem icon={Users} label="Invités" value={commande.guestCount ? `${commande.guestCount} pax` : "Non renseigné"} />
                <InfoItem icon={Package} label="Menu" value={commande.menuName || "Non défini"} />
                <InfoItem icon={Tag} label="Type" value={commande.eventType ? (TYPE_LABELS[commande.eventType] || commande.eventType) : "Non défini"} />
                {commande.pricePerPerson && (
                  <InfoItem icon={Wallet} label="Prix par personne" value={mad(Number(commande.pricePerPerson))} />
                )}
                <InfoItem icon={Calendar} label="Créée le" value={formatDate(commande.createdAt)} />
                <InfoItem icon={Clock} label="Mise à jour" value={formatDate(commande.updatedAt)} />
              </div>
            </motion.div>

            {/* Items List */}
            {commande.items && commande.items.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
              >
                <div className="p-6 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Receipt className="size-4 text-muted-foreground" />
                    <h3 className="font-display text-xl">Articles</h3>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-12 px-6 py-3 text-[10px] uppercase tracking-wider text-muted-foreground bg-foreground/[0.02]">
                    <div className="col-span-5">Article</div>
                    <div className="col-span-2 text-center">Qté</div>
                    <div className="col-span-2 text-right">Prix unit.</div>
                    <div className="col-span-3 text-right">Total</div>
                  </div>
                  {commande.items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.03 * i }}
                      className="grid grid-cols-12 items-center px-6 py-3 hover:bg-foreground/[0.02] transition-colors"
                    >
                      <div className="col-span-5 text-sm font-medium truncate">{item.name}</div>
                      <div className="col-span-2 text-sm text-center tabular-nums">{item.quantity}</div>
                      <div className="col-span-2 text-sm text-right tabular-nums">{mad(Number(item.unitPrice))}</div>
                      <div className="col-span-3 text-sm text-right font-medium tabular-nums">{mad(Number(item.totalPrice))}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Financial Summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-border bg-card shadow-soft p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <Wallet className="size-4 text-muted-foreground" />
                <h3 className="font-display text-xl">Résumé financier</h3>
              </div>
              <div className="space-y-3">
                <FinRow label="Sous-total articles" value={mad(itemsSubtotal)} />
                {(commande.transportFees ?? 0) > 0 && <FinRow label="Transport" value={mad(Number(commande.transportFees ?? 0))} />}
                {(commande.deliveryFees ?? 0) > 0 && <FinRow label="Livraison" value={mad(Number(commande.deliveryFees ?? 0))} />}
                {(commande.equipmentFees ?? 0) > 0 && <FinRow label="Équipement" value={mad(Number(commande.equipmentFees ?? 0))} />}
                {totalFees > 0 && <FinRow label="Total frais" value={mad(totalFees)} />}
                {discountAmount > 0 && (
                  <FinRow
                    label={`Remise ${isDiscountPercentage ? `(${Number(commande.discountValue ?? 0)}%)` : ""}`}
                    value={`-${mad(discountAmount)}`}
                    className="text-emerald-600"
                  />
                )}
                <div className="h-px bg-border" />
                <FinRow label="Total" value={mad(total)} className="font-display text-xl text-gradient-charcoal" />
                <FinRow label="Acompte" value={mad(paid)} muted />
                <FinRow label="Reste à payer" value={mad(remaining)} muted />
              </div>
            </motion.div>

            {/* Notes */}
            {(commande.internalNotes || commande.clientNotes || commande.notes) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-2xl border border-border bg-card shadow-soft p-6"
              >
                <div className="flex items-center gap-2 mb-5">
                  <FileText className="size-4 text-muted-foreground" />
                  <h3 className="font-display text-xl">Notes</h3>
                </div>
                <div className="space-y-4">
                  {commande.internalNotes && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Notes internes</div>
                      <p className="text-sm whitespace-pre-wrap">{commande.internalNotes}</p>
                    </div>
                  )}
                  {commande.clientNotes && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Notes client</div>
                      <p className="text-sm whitespace-pre-wrap">{commande.clientNotes}</p>
                    </div>
                  )}
                  {commande.notes && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Notes générales</div>
                      <p className="text-sm whitespace-pre-wrap">{commande.notes}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </div>

          {/* ---------- RIGHT COLUMN (1/3) ---------- */}
          <aside className="space-y-6">

            {/* Client Card */}
            {commande.client && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="rounded-2xl border border-border bg-card shadow-soft p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="size-4 text-[var(--gold-deep)]" />
                  <h3 className="font-display text-xl">Client</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-gradient-to-br from-[var(--gold-soft)] to-[var(--gold-deep)]/20 flex items-center justify-center text-sm font-medium text-[var(--gold-foreground)]">
                      {commande.client.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <div className="font-medium">{commande.client.name}</div>
                      <Link href={`/dashboard/clients/${commande.client.id}`} className="text-xs text-[var(--gold-deep)] hover:underline inline-flex items-center gap-1">
                        Voir le profil <ChevronRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="space-y-3">
                    {commande.client.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="size-3.5 text-muted-foreground shrink-0" />
                        <a href={`tel:${commande.client.phone}`} className="hover:text-foreground transition-colors">{commande.client.phone}</a>
                      </div>
                    )}
                    {commande.client.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="size-3.5 text-muted-foreground shrink-0" />
                        <a href={`mailto:${commande.client.email}`} className="hover:text-foreground transition-colors">{commande.client.email}</a>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Event Card */}
            {commande.event && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.17 }}
                className="rounded-2xl border border-border bg-card shadow-soft p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <PartyPopper className="size-4 text-muted-foreground" />
                  <h3 className="font-display text-xl">Événement</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium">{commande.event.name}</div>
                    <Link href={`/dashboard/events/${commande.event.id}`} className="text-xs text-[var(--gold-deep)] hover:underline inline-flex items-center gap-1 mt-0.5">
                      Voir l&apos;événement <ChevronRight className="size-3" />
                    </Link>
                  </div>
                  {commande.event.startDate && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                      <span>{formatDate(commande.event.startDate)}</span>
                    </div>
                  )}
                  {commande.event.type && (
                    <div className="flex items-center gap-3 text-sm">
                      <Tag className="size-3.5 text-muted-foreground shrink-0" />
                      <span>{TYPE_LABELS[commande.event.type] || commande.event.type}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Menu Card */}
            {commande.menu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                className="rounded-2xl border border-border bg-card shadow-soft p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Package className="size-4 text-muted-foreground" />
                  <h3 className="font-display text-xl">Menu</h3>
                </div>
                <div className="text-sm font-medium">{commande.menu.name}</div>
              </motion.div>
            )}

            {/* Status Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.27 }}
              className="rounded-2xl border border-border bg-card shadow-soft p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="size-4 text-muted-foreground" />
                <h3 className="font-display text-xl">Activité</h3>
              </div>
              <div className="relative space-y-0">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                {activities.map((a, i) => (
                  <div key={i} className="relative flex items-start gap-3 pb-4 last:pb-0">
                    <div className={`relative z-10 p-0.5 rounded-full bg-card ${a.color}`}>
                      <a.icon className="size-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs leading-snug">{a.label}</div>
                      {a.time && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">{a.time}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </aside>
        </div>

        {/* Footer */}
        <footer className="mt-16 mb-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            Mis à jour le {formatDate(commande.updatedAt)}
          </div>
          <div>© TUR — Suite traiteur premium</div>
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
      className={`group relative overflow-hidden rounded-2xl border p-5 shadow-soft transition-all hover:shadow-lift ${accent ? "border-gold bg-card" : "border-border bg-card"}`}
    >
      {accent && (
        <div className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full bg-gradient-gold opacity-20 blur-2xl" />
      )}
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className={`size-9 rounded-xl flex items-center justify-center ${accent ? "bg-gradient-gold text-[var(--gold-foreground)]" : "bg-foreground/[0.04] text-foreground"}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="font-display text-2xl text-gradient-charcoal tabular-nums">{value}</div>
    </motion.div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  const isMissing = value.includes("non") || value.includes("Non") || value.includes("Aucun");
  return (
    <div className="flex items-start gap-3">
      <div className="size-8 rounded-lg bg-foreground/[0.04] flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`text-sm mt-0.5 truncate ${isMissing ? "text-muted-foreground/60 italic" : "font-medium"}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

function FinRow({ label, value, muted, className }: { label: string; value: string; muted?: boolean; className?: string }) {
  return (
    <div className={`flex items-center justify-between ${muted ? "text-muted-foreground" : ""} ${className || ""}`}>
      <span className="text-sm">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
