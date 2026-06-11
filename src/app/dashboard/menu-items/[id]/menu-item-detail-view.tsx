"use client"

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Trash2, Sparkles, FileText, Package,
  Tag, Clock, CheckCircle2, AlertTriangle, Crown,
  ImageIcon, CircleDot, Hourglass, TrendingUp, Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditMenuItemDialog } from "@/features/menu-items/components/edit-menu-item-dialog";
import { DeleteMenuItemDialog } from "@/features/menu-items/components/delete-menu-item-dialog";
import type { MenuItem } from "@/features/menu-items/types";
import { formatCurrency } from "@/lib/utils";
import { CATEGORY_LABELS, CATEGORY_BADGE_COLORS } from "@/features/menu-items/constants";

const categoryEmojis: Record<string, string> = {
  FOOD: "🍲", DRINKS: "🍹", DESSERTS: "🍬", DECORATION: "💐",
  STAFF: "🎩", ENTERTAINMENT: "🎧", EXTRAS: "🎆",
};

export default function MenuItemDetailView({ item }: { item: MenuItem }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const formatDate = (d: Date | string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const activities = useMemo(() => {
    const items: Array<{ icon: typeof Sparkles; label: string; time: string; color: string }> = [
      { icon: Sparkles, label: "Article créé", time: formatDate(item.createdAt), color: "text-emerald-600" },
    ];
    if (item.updatedAt && item.updatedAt !== item.createdAt) {
      items.push({
        icon: Pencil,
        label: "Informations mises à jour",
        time: formatDate(item.updatedAt),
        color: "text-blue-600",
      });
    }
    return items;
  }, [item.createdAt, item.updatedAt]);

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
              href="/dashboard/menu-items"
              className="mt-2 size-10 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-foreground/[0.04] transition-colors shadow-soft shrink-0"
            >
              <ArrowLeft className="size-4 text-muted-foreground" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Sparkles className="size-3 text-[var(--gold-deep)]" />
                <span>Détail de l&apos;article</span>
              </div>
              <h1 className="font-display text-4xl lg:text-5xl text-gradient-charcoal leading-[1.05]">
                {item.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`text-[11px] px-3 py-1 rounded-full font-medium ${CATEGORY_BADGE_COLORS[item.category] || "bg-foreground/[0.05] text-muted-foreground"}`}>
                  {CATEGORY_LABELS[item.category] || item.category}
                </span>
                <span
                  className={`text-[11px] px-3 py-1 rounded-full font-medium ${
                    item.isActive
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50"
                      : "bg-gray-100 text-gray-700 ring-1 ring-gray-300/50"
                  }`}
                >
                  {item.isActive ? "Actif" : "Inactif"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Créé le {formatDate(item.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-xl border-border shadow-soft"
              onClick={() => setEditOpen(true)}
              title="Modifier"
            >
              <Pencil className="size-4" />
            </Button>
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
          <KpiCard
            icon={Tag}
            label="Prix unitaire"
            value={formatCurrency(item.unitPrice)}
            accent
          />
          <KpiCard
            icon={Package}
            label="Unité"
            value={item.unit || "Non renseignée"}
          />
          <KpiCard
            icon={item.isActive ? CheckCircle2 : Hourglass}
            label="Statut"
            value={item.isActive ? "Actif" : "Inactif"}
            accent={item.isActive}
          />
          <KpiCard
            icon={Clock}
            label="Créé le"
            value={formatDate(item.createdAt)}
          />
        </motion.div>

        {/* ==================== MAIN GRID ==================== */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ---------- LEFT COLUMN (2/3) ---------- */}
          <div className="xl:col-span-2 space-y-6">

            {/* Article Information */}
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
                <InfoItem icon={Package} label="Catégorie" value={CATEGORY_LABELS[item.category] || item.category} />
                <InfoItem icon={Tag} label="Prix unitaire" value={formatCurrency(item.unitPrice)} />
                <InfoItem icon={Utensils} label="Unité" value={item.unit || "Non renseignée"} />
                <InfoItem icon={Clock} label="Créé le" value={formatDate(item.createdAt)} />
                <InfoItem icon={Pencil} label="Mis à jour le" value={formatDate(item.updatedAt)} />
                <InfoItem
                  icon={item.isActive ? CheckCircle2 : AlertTriangle}
                  label="Statut"
                  value={item.isActive ? "Actif" : "Inactif"}
                />
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
                <FileText className="size-4 text-muted-foreground" />
                <h3 className="font-display text-xl">Description</h3>
              </div>
              {item.notes ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.notes}</p>
              ) : (
                <div className="py-8 flex flex-col items-center gap-3 text-muted-foreground">
                  <FileText className="size-8 opacity-40" />
                  <p className="text-sm">Aucune description associée à cet article.</p>
                </div>
              )}
            </motion.div>

            {/* Usage Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-border bg-card shadow-soft p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="size-4 text-muted-foreground" />
                <h3 className="font-display text-xl">Statistiques d&apos;utilisation</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="rounded-xl bg-foreground/[0.03] p-5">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Utilisations</div>
                  <div className="font-display text-3xl text-gradient-charcoal tabular-nums">
                    {item.usageCount ?? 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">fois dans les commandes</div>
                </div>
                <div className="rounded-xl bg-foreground/[0.03] p-5">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Impact prix</div>
                  <div className="font-display text-3xl text-gradient-charcoal tabular-nums">
                    {formatCurrency(item.unitPrice * (item.usageCount ?? 0))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">revenu estimé</div>
                </div>
              </div>
            </motion.div>

          </div>

          {/* ---------- RIGHT COLUMN (1/3) ---------- */}
          <aside className="space-y-6">

            {/* Image Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
            >
              {item.imageUrl ? (
                <div className="relative">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-xs text-white/80 flex items-center gap-1.5">
                    <ImageIcon className="size-3" />
                    <span>Image de l&apos;article</span>
                  </div>
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <span className="text-5xl">{categoryEmojis[item.category] || "📦"}</span>
                  <p className="text-sm">Aucune image</p>
                </div>
              )}
            </motion.div>

            {/* Category Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.17 }}
              className="rounded-2xl border border-border bg-card shadow-soft p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Crown className="size-4 text-[var(--gold-deep)]" />
                <h3 className="font-display text-xl">Catégorie</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-gradient-to-br from-[var(--gold-soft)] to-[var(--gold-deep)]/20 flex items-center justify-center text-lg">
                  {categoryEmojis[item.category] || "📦"}
                </div>
                <div>
                  <div className="font-medium">{CATEGORY_LABELS[item.category] || item.category}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {item.isActive ? "Actuellement disponible" : "Indisponible"}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
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
            Mis à jour le {formatDate(item.updatedAt)}
          </div>
          <div>© TUR — Suite traiteur premium</div>
        </footer>
      </div>

      <EditMenuItemDialog
        item={item}
        open={editOpen}
        onClose={setEditOpen}
        onSuccess={() => window.location.reload()}
      />
      <DeleteMenuItemDialog
        item={item}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={() => { window.location.href = "/dashboard/menu-items"; }}
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
  const isMissing = value.includes("non") || value.includes("Non") || value.includes("Aucun") || value.includes("Indisponible");
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
