"use client"

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Trash2, Sparkles, FileText, Package,
  Tag, Clock, CheckCircle2, AlertTriangle, Crown,
  Users, Utensils, DollarSign, BarChart3, CircleDot,
  TrendingUp, ChefHat, Wine, Cake, Flower2, Box,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/use-role";
import dynamic from "next/dynamic";
const EditMenuDialog = dynamic(() => import("@/features/menus/components/edit-menu-dialog").then((m) => m.EditMenuDialog), { loading: () => null });
const DeleteMenuDialog = dynamic(() => import("@/features/menus/components/delete-menu-dialog").then((m) => m.DeleteMenuDialog), { loading: () => null });
import type { Menu } from "@/features/menus/types";
import { formatCurrency } from "@/lib/utils";
import { CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_BADGE_COLORS } from "@/features/menus/constants";

export default function MenuDetailView({ menu }: { menu: Menu }) {
  const { can } = useRole();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const formatDate = (d: Date | string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const itemsCount = menu.menuItems?.length ?? 0;
  const totalValue = itemsCount > 0
    ? menu.menuItems!.reduce((s, mi) => s + Number(mi.menuItem.unitPrice) * mi.defaultQty, 0)
    : 0;

  const categoryIconMap: Record<string, any> = {
    FOOD: ChefHat, DRINKS: Wine, DESSERTS: Cake,
    DECORATION: Flower2, STAFF: Users, ENTERTAINMENT: Box, EXTRAS: Box,
  };

  const categoryLabelMap: Record<string, string> = {
    FOOD: 'Aliment', DRINKS: 'Boisson', DESSERTS: 'Dessert',
    DECORATION: 'Décoration', STAFF: 'Personnel', ENTERTAINMENT: 'Divertissement', EXTRAS: 'Extras',
  };

  const activities = useMemo(() => {
    const items: Array<{ icon: typeof Sparkles; label: string; time: string; color: string }> = [
      { icon: Sparkles, label: "Menu créé", time: formatDate(menu.createdAt), color: "text-emerald-600" },
    ];
    if (menu.updatedAt && menu.updatedAt !== menu.createdAt) {
      items.push({
        icon: Pencil,
        label: "Informations mises à jour",
        time: formatDate(menu.updatedAt),
        color: "text-blue-600",
      });
    }
    return items;
  }, [menu.createdAt, menu.updatedAt]);

  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />

      <div className="relative mx-auto max-w-[1480px] px-6 py-8 lg:px-10">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-10"
        >
          <div className="flex items-start gap-4">
              <Link
                href="/dashboard/menus"
                className="mt-2 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:size-10 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-foreground/[0.04] transition-colors shadow-soft shrink-0"
              >
              <ArrowLeft className="size-4 text-muted-foreground" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Sparkles className="size-3 text-[var(--gold-deep)]" />
                <span>Détail du menu</span>
              </div>
              <h1 className="font-display text-4xl lg:text-5xl text-gradient-charcoal leading-[1.05]">
                {menu.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`text-[11px] px-3 py-1 rounded-full font-medium ${CATEGORY_BADGE_COLORS[menu.category] || "bg-foreground/[0.05] text-muted-foreground"}`}>
                  {CATEGORY_LABELS[menu.category] || menu.category}
                </span>
                <span
                  className={`text-[11px] px-3 py-1 rounded-full font-medium ${
                    menu.isActive
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50"
                      : "bg-gray-100 text-gray-700 ring-1 ring-gray-300/50"
                  }`}
                >
                  {menu.isActive ? "Actif" : "Inactif"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Créé le {formatDate(menu.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {can('menus', 'update') && (
              <Button
                variant="outline"
                size="icon"
                className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:size-10 rounded-xl border-border shadow-soft"
                onClick={() => setEditOpen(true)}
                title="Modifier"
              >
                <Pencil className="size-4" />
              </Button>
            )}
            {can('menus', 'delete') && (
              <Button
                variant="outline"
                size="icon"
                className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:size-10 rounded-xl border-border shadow-soft text-muted-foreground hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                onClick={() => setDeleteOpen(true)}
                title="Supprimer"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <KpiCard
            icon={Tag}
            label="Prix par table"
            value={formatCurrency(menu.pricePerPerson)}
            accent
          />
          <KpiCard
            icon={TableIcon}
            label="Capacité"
            value={menu.minPersons + (menu.maxPersons ? `–${menu.maxPersons}` : '+') + ' tables'}
          />
          <KpiCard
            icon={Utensils}
            label="Articles inclus"
            value={`${itemsCount} article${itemsCount > 1 ? 's' : ''}`}
          />
          <KpiCard
            icon={menu.isActive ? CheckCircle2 : AlertTriangle}
            label="Statut"
            value={menu.isActive ? 'Actif' : 'Inactif'}
            accent={menu.isActive}
          />
        </motion.div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left column (2/3) */}
          <div className="xl:col-span-2 space-y-6">

            {/* Informations */}
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
                <InfoItem icon={Package} label="Catégorie" value={CATEGORY_LABELS[menu.category] || menu.category} />
                <InfoItem icon={DollarSign} label="Prix par table" value={formatCurrency(menu.pricePerPerson)} />
                <InfoItem icon={TableIcon} label="Nb. min de tables" value={`${menu.minPersons} tables`} />
                <InfoItem icon={TableIcon} label="Nb. max de tables" value={menu.maxPersons ? `${menu.maxPersons} tables` : 'Non défini'} />
                <InfoItem icon={Clock} label="Créé le" value={formatDate(menu.createdAt)} />
                <InfoItem icon={Pencil} label="Mis à jour le" value={formatDate(menu.updatedAt)} />
              </div>
            </motion.div>

            {/* Description */}
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
              {menu.description ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{menu.description}</p>
              ) : (
                <div className="py-8 flex flex-col items-center gap-3 text-muted-foreground">
                  <FileText className="size-8 opacity-40" />
                  <p className="text-sm">Aucune description associée à ce menu.</p>
                </div>
              )}
            </motion.div>

            {/* Composition du Menu */}
            {menu.menuItems && menu.menuItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
              >
                <div className="p-6 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Utensils className="size-4 text-muted-foreground" />
                    <h3 className="font-display text-xl">Composition du Menu</h3>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {menu.menuItems.map((item, i) => {
                    const Icon = categoryIconMap[item.menuItem.category] || Box;
                    const catLabel = categoryLabelMap[item.menuItem.category] || item.menuItem.category;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.03 * i }}
                        className="flex items-center gap-3 px-6 py-4 hover:bg-foreground/[0.02] transition-colors"
                      >
                        {item.menuItem.imageUrl ? (
                          <img src={item.menuItem.imageUrl} alt={item.menuItem.name} className="size-12 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="size-12 rounded-lg bg-foreground/[0.04] flex items-center justify-center shrink-0">
                            <Icon className="size-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium break-words leading-snug">{item.menuItem.name}</div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/[0.05] text-muted-foreground">
                              {catLabel}
                            </span>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {formatCurrency(item.menuItem.unitPrice)}{item.menuItem.unit ? ` / ${item.menuItem.unit}` : ''}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 text-sm font-medium tabular-nums ml-2">
                          ×{item.defaultQty}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

          </div>

          {/* Right column (1/3) */}
          <aside className="space-y-6">

            {/* Category Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="rounded-2xl border border-border bg-card shadow-soft p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Crown className="size-4 text-[var(--gold-deep)]" />
                <h3 className="font-display text-xl">Catégorie</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-gradient-to-br from-[var(--gold-soft)] to-[var(--gold-deep)]/20 flex items-center justify-center">
                  {(() => { const Icon = CATEGORY_ICONS[menu.category]; return Icon ? <Icon className="size-5 text-[var(--gold-deep)]" /> : null; })()}
                </div>
                <div>
                  <div className="font-medium">{CATEGORY_LABELS[menu.category] || menu.category}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {menu.isActive ? 'Actuellement disponible' : 'Indisponible'}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.17 }}
              className="rounded-2xl border border-border bg-card shadow-soft p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="size-4 text-muted-foreground" />
                <h3 className="font-display text-xl">Statistiques</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Articles inclus</div>
                  <div className="font-display text-2xl text-gradient-charcoal tabular-nums">{itemsCount}</div>
                </div>
                <div className="h-px bg-border" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Valeur totale des articles</div>
                  <div className="font-display text-2xl text-gradient-charcoal tabular-nums">{formatCurrency(totalValue)}</div>
                </div>
                <div className="h-px bg-border" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Capacité</div>
                  <div className="font-display text-xl text-gradient-charcoal tabular-nums">
                    {menu.minPersons}{menu.maxPersons ? ` – ${menu.maxPersons}` : '+'} tables
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
            Mis à jour le {formatDate(menu.updatedAt)}
          </div>
          <div>© TUR — Suite traiteur premium</div>
        </footer>
      </div>

      <EditMenuDialog
        menu={menu}
        open={editOpen}
        onClose={setEditOpen}
        onSuccess={() => window.location.reload()}
      />
      <DeleteMenuDialog
        menu={menu}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={() => { window.location.href = "/dashboard/menus"; }}
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
      <div className="flex items-start justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${accent ? "bg-gradient-gold text-[var(--gold-foreground)]" : "bg-foreground/[0.04] text-foreground"}`}>
          <Icon className="size-5" />
        </div>
      </div>
      <div className="mt-3 font-display text-lg sm:text-xl lg:text-2xl text-gradient-charcoal tabular-nums">{value}</div>
    </motion.div>
  );
}

function TableIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 491.413 491.413"
      fill="currentColor"
      className={className}
    >
      <path d="M491.413,133.867c0-62.4-126.613-96.107-245.653-96.107S0,71.467,0,133.867c0,60.48,118.72,93.973,234.453,96v125.76
        c-0.213,0.747-0.533,1.387-0.853,2.133c-4.587,0.32-8.533,3.52-9.6,8.107c-1.173,4.16-2.773,8.107-4.8,11.947
        c-1.067,0.533-2.24,0.853-3.413,1.067c-12.373,1.6-30.08-17.707-36.693-27.307c-3.307-4.907-10.027-6.08-14.827-2.773
        c-4.8,3.307-6.08,10.027-2.773,14.827c2.347,3.413,20.373,29.013,42.987,35.2c-13.013,14.08-34.027,28.373-67.84,33.6
        c-5.867,0.853-9.813,6.293-8.96,12.16c0.747,5.227,5.333,9.067,10.56,9.067c0.533,0,1.067,0,1.6-0.107
        c56.853-8.64,83.733-39.68,95.787-61.227c3.627-3.093,6.827-6.613,9.387-10.667c2.56,3.947,5.76,7.573,9.387,10.667
        c12.16,21.547,39.04,52.587,95.893,61.227c0.533,0.107,1.067,0.107,1.6,0.107c5.867,0,10.667-4.8,10.667-10.667
        c0-5.333-3.84-9.813-9.067-10.56c-33.92-5.227-55.04-19.52-67.947-33.6c22.613-6.293,40.747-31.893,43.093-35.307
        c3.307-4.907,2.027-11.52-2.773-14.827c-4.907-3.307-11.52-2.027-14.827,2.773c-6.507,9.6-24.213,29.013-36.693,27.307
        c-1.173-0.107-2.453-0.533-3.52-1.067c-1.92-3.84-3.52-7.787-4.693-11.947c-1.067-4.48-5.013-7.787-9.6-8
        c-0.32-0.747-0.533-1.387-0.853-2.133l0.107-125.653C371.84,228.16,491.413,194.56,491.413,133.867z M248.32,208.747
        c-1.707-0.747-3.733-0.747-5.44,0C112.747,208,22.187,169.067,22.187,134.08c0-35.307,91.947-74.667,224-74.667
        s224,39.36,224,74.667C470.187,169.173,379.2,208.32,248.32,208.747z"/>
    </svg>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  const isMissing = value.includes("non") || value.includes("Non") || value.includes("Aucun") || value.includes("Indisponible");
  return (
    <div className="flex items-start gap-3">
      <div className="size-9 rounded-lg bg-foreground/[0.04] flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`text-sm mt-1 whitespace-pre-wrap break-words ${isMissing ? "text-muted-foreground/60 italic" : "font-medium"}`}>
          {value}
        </div>
      </div>
    </div>
  );
}
