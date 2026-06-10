"use client"

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, User, Phone, Mail, MapPin, ShoppingCart, Calendar,
  Pencil, Crown, Building, FileText, Clock, Wallet,
  CircleDollarSign, MapPinHouse, StickyNote, Sparkles,
} from "lucide-react";
import type { ClientWithStats } from "@/features/clients/types";

const mad = (n: number) =>
  new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(n);

const COMMANDE_STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  QUOTED: "bg-blue-50 text-blue-700",
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  READY: "bg-purple-50 text-purple-700",
  DELIVERED: "bg-emerald-800 text-white",
  CANCELLED: "bg-red-50 text-red-700",
};

const COMMANDE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  QUOTED: "Devis",
  CONFIRMED: "Confirmée",
  IN_PROGRESS: "En cours",
  READY: "Prête",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

const EVENT_STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PLANNED: "bg-blue-50 text-blue-700",
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-emerald-800 text-white",
  CANCELLED: "bg-red-50 text-red-700",
};

const EVENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  PLANNED: "Planifié",
  CONFIRMED: "Confirmé",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

export default function ClientDetailView({ client }: { client: ClientWithStats }) {
  const initials = client.name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("");

  const formatDate = (d: Date | string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const memberSince = formatDate(client.createdAt);
  const lastOrder = client.lastOrderAt ? formatDate(client.lastOrderAt) : null;

  const activities = useMemo(() => {
    const items: Array<{ icon: typeof Sparkles; label: string; time?: string; color: string }> = [
      { icon: Sparkles, label: "Client créé", time: formatDate(new Date(client.createdAt)), color: "text-emerald-600" },
    ];
    if (client.updatedAt && new Date(client.updatedAt).getTime() - new Date(client.createdAt).getTime() > 1000) {
      items.push({
        icon: Pencil,
        label: "Informations mises à jour",
        time: formatDate(new Date(client.updatedAt)),
        color: "text-blue-600",
      });
    }
    if (client.lastOrderAt) {
      items.push({
        icon: ShoppingCart,
        label: "Dernière commande passée",
        time: formatDate(new Date(client.lastOrderAt)),
        color: "text-purple-600",
      });
    }
    return items;
  }, [client.createdAt, client.updatedAt, client.lastOrderAt]);

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
              href="/dashboard/clients"
              className="mt-2 size-10 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-foreground/[0.04] transition-colors shadow-soft shrink-0"
            >
              <ArrowLeft className="size-4 text-muted-foreground" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Crown className="size-3 text-[var(--gold-deep)]" />
                <span>Fiche client</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-full bg-gradient-to-br from-[var(--gold-soft)] to-[var(--gold-deep)]/20 flex items-center justify-center text-xl font-medium text-[var(--gold-foreground)] shrink-0">
                  {initials}
                </div>
                <div>
                  <h1 className="font-display text-4xl lg:text-5xl text-gradient-charcoal leading-[1.05]">
                    {client.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {client.company && (
                      <span className="text-[11px] px-3 py-1 rounded-full font-medium bg-foreground/[0.04] text-muted-foreground inline-flex items-center gap-1">
                        <Building className="size-3" />
                        {client.company}
                      </span>
                    )}
                    {client.city && (
                      <span className="text-[11px] px-3 py-1 rounded-full font-medium bg-foreground/[0.04] text-muted-foreground inline-flex items-center gap-1">
                        <MapPin className="size-3" />
                        {client.city}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Membre depuis {memberSince}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ==================== KPI CARDS ==================== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <KpiCard
            icon={Wallet}
            label="Total dépensé"
            value={client.totalSpent ? mad(Number(client.totalSpent)) : "0 MAD"}
            accent
          />
          <KpiCard
            icon={ShoppingCart}
            label="Commandes"
            value={`${client.commandesCount ?? 0}`}
          />
          <KpiCard
            icon={Calendar}
            label="Événements"
            value={`${client.eventsCount ?? 0}`}
          />
          <KpiCard
            icon={lastOrder ? Clock : Calendar}
            label="Dernière commande"
            value={lastOrder ?? "Aucune commande"}
          />
        </motion.div>

        {/* ==================== MAIN GRID ==================== */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ---------- LEFT COLUMN (2/3) ---------- */}
          <div className="xl:col-span-2 space-y-6">

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border bg-card shadow-soft p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <User className="size-4 text-muted-foreground" />
                <h3 className="font-display text-xl">Contact</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <InfoItem icon={Mail} label="Email" value={client.email || "Aucun email renseigné"} />
                <InfoItem icon={Phone} label="Téléphone" value={client.phone || "Aucun téléphone renseigné"} />
                <InfoItem icon={Building} label="Entreprise" value={client.company || "Aucune entreprise renseignée"} />
                <InfoItem icon={MapPinHouse} label="Adresse" value={client.address || "Aucune adresse renseignée"} />
                <InfoItem icon={MapPin} label="Ville" value={client.city || "Aucune ville renseignée"} />
                <InfoItem icon={FileText} label="Code postal" value={client.postalCode || "Aucun code postal renseigné"} />
                {client.siret && (
                  <InfoItem icon={FileText} label="SIRET" value={client.siret} />
                )}
              </div>
            </motion.div>

            {/* Notes */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl border border-border bg-card shadow-soft p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <StickyNote className="size-4 text-muted-foreground" />
                <h3 className="font-display text-xl">Notes</h3>
              </div>
              {client.notes ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{client.notes}</p>
              ) : (
                <div className="py-8 flex flex-col items-center gap-3 text-muted-foreground">
                  <StickyNote className="size-8 opacity-40" />
                  <p className="text-sm">Aucune note associée à ce client.</p>
                </div>
              )}
            </motion.div>

            {/* Related Orders */}
            {client.commandes && client.commandes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
              >
                <div className="p-6 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingCart className="size-4 text-muted-foreground" />
                    <h3 className="font-display text-xl">Dernières commandes</h3>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-12 px-6 py-3 text-[10px] uppercase tracking-wider text-muted-foreground bg-foreground/[0.02]">
                    <div className="col-span-4">Commande</div>
                    <div className="col-span-4 text-right">Montant</div>
                    <div className="col-span-4 text-right">Statut</div>
                  </div>
                  {client.commandes.map((c, i) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.03 * i }}
                      className="grid grid-cols-12 items-center px-6 py-4 hover:bg-foreground/[0.02] transition-colors"
                    >
                      <div className="col-span-4 text-sm font-medium tabular-nums">#{c.number || c.id.slice(0, 8)}</div>
                      <div className="col-span-4 text-sm font-medium text-right tabular-nums">{c.totalAmount ? mad(Number(c.totalAmount)) : "—"}</div>
                      <div className="col-span-4 flex justify-end">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${COMMANDE_STATUS_STYLES[c.status] || "bg-foreground/[0.05] text-muted-foreground"}`}>
                          {COMMANDE_STATUS_LABELS[c.status] || c.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Related Events */}
            {client.events && client.events.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
              >
                <div className="p-6 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="size-4 text-muted-foreground" />
                    <h3 className="font-display text-xl">Derniers événements</h3>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-12 px-6 py-3 text-[10px] uppercase tracking-wider text-muted-foreground bg-foreground/[0.02]">
                    <div className="col-span-5">Événement</div>
                    <div className="col-span-3">Type</div>
                    <div className="col-span-4 text-right">Statut</div>
                  </div>
                  {client.events.map((e, i) => (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.03 * i }}
                      className="grid grid-cols-12 items-center px-6 py-4 hover:bg-foreground/[0.02] transition-colors"
                    >
                      <div className="col-span-5 text-sm font-medium">{e.name}</div>
                      <div className="col-span-3 text-xs text-muted-foreground">{e.type}</div>
                      <div className="col-span-4 flex justify-end">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${EVENT_STATUS_STYLES[e.status] || "bg-foreground/[0.05] text-muted-foreground"}`}>
                          {EVENT_STATUS_LABELS[e.status] || e.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Empty state when no commandes and no events */}
            {(!client.commandes || client.commandes.length === 0) && (!client.events || client.events.length === 0) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-border bg-card shadow-soft p-10"
              >
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="size-16 rounded-full bg-foreground/[0.03] flex items-center justify-center">
                    <ShoppingCart className="size-8 text-muted-foreground/30" strokeWidth={1.2} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Aucune activité récente</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Ce client n&apos;a pas encore de commandes ou d&apos;événements associés.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

          </div>

          {/* ---------- RIGHT COLUMN (1/3) ---------- */}
          <aside className="space-y-6">

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="rounded-2xl border border-border bg-card shadow-soft p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <CircleDollarSign className="size-4 text-[var(--gold-deep)]" />
                <h3 className="font-display text-xl">Résumé</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total dépensé</span>
                  <span className="font-display text-lg text-gradient-charcoal tabular-nums">
                    {client.totalSpent ? mad(Number(client.totalSpent)) : "0 MAD"}
                  </span>
                </div>
                <div className="h-px bg-border" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Commandes</span>
                    <span className="font-medium">{client.commandesCount ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Événements</span>
                    <span className="font-medium">{client.eventsCount ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Membre depuis</span>
                    <span className="font-medium">{memberSince}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Activity Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.17 }}
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

            {/* Contact Info Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="rounded-2xl border border-border bg-card shadow-soft p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Phone className="size-4 text-muted-foreground" />
                <h3 className="font-display text-xl">Coordonnées</h3>
              </div>
              {client.email || client.phone || client.address ? (
                <div className="space-y-3">
                  {client.phone && (
                    <a
                      href={`tel:${client.phone}`}
                      className="flex items-center gap-3 text-sm hover:text-foreground transition-colors group"
                    >
                      <div className="size-8 rounded-lg bg-foreground/[0.04] flex items-center justify-center shrink-0">
                        <Phone className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                      <span>{client.phone}</span>
                    </a>
                  )}
                  {client.email && (
                    <a
                      href={`mailto:${client.email}`}
                      className="flex items-center gap-3 text-sm hover:text-foreground transition-colors group"
                    >
                      <div className="size-8 rounded-lg bg-foreground/[0.04] flex items-center justify-center shrink-0">
                        <Mail className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                      <span className="break-all">{client.email}</span>
                    </a>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="size-8 rounded-lg bg-foreground/[0.04] flex items-center justify-center shrink-0">
                        <MapPin className="size-3.5 text-muted-foreground" />
                      </div>
                      <span className="text-muted-foreground">{client.address}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center gap-3 text-muted-foreground">
                  <Phone className="size-8 opacity-40" />
                  <p className="text-sm">Aucune information de contact</p>
                </div>
              )}
            </motion.div>

          </aside>
        </div>

        {/* Footer */}
        <footer className="mt-16 mb-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            Mis à jour le {formatDate(new Date(client.updatedAt))}
          </div>
          <div>© TUR — Suite traiteur premium</div>
        </footer>
      </div>
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
