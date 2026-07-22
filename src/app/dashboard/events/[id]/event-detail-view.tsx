"use client"

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Trash2, Calendar, MapPin, Wallet,
  Sparkles, Clock, FileText, PartyPopper, CheckCircle2, Crown,
  Phone, Mail, User, ChevronRight, CircleDot, Banknote, Receipt,
  Hourglass, TrendingUp, AlertTriangle, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/use-role";
import dynamic from "next/dynamic";
const EditEventDialog = dynamic(() => import("@/features/events/components/edit-event-dialog").then((m) => m.EditEventDialog), { loading: () => null });
const DeleteEventDialog = dynamic(() => import("@/features/events/components/delete-event-dialog").then((m) => m.DeleteEventDialog), { loading: () => null });
import type { EventDetail } from "@/features/events/types";

const mad = (n: number) =>
  new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(n);

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon", PLANNED: "Planifié", CONFIRMED: "Confirmé",
  IN_PROGRESS: "En cours", COMPLETED: "Terminé", CANCELLED: "Annulé",
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 ring-1 ring-gray-300/50",
  PLANNED: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/50",
  CONFIRMED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50",
  IN_PROGRESS: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50",
  COMPLETED: "bg-emerald-800 text-white ring-1 ring-emerald-900/50",
  CANCELLED: "bg-red-50 text-red-700 ring-1 ring-red-200/50",
};

const TYPE_LABELS: Record<string, string> = {
  WEDDING: "Mariage", CORPORATE: "Entreprise", BIRTHDAY: "Anniversaire",
  ANNIVERSARY: "Cocktail", HOLIDAY: "Gala", OTHER: "Privé",
};

const STATUS_ORDER: Record<string, number> = {
  DRAFT: 0, PLANNED: 1, CONFIRMED: 2, IN_PROGRESS: 3, COMPLETED: 4,
};

const TIMELINE_STEPS = [
  { key: "INFO", label: "Informations reçues", icon: FileText },
  { key: "MENU", label: "Menu validé", icon: Receipt },
  { key: "PAYMENT", label: "Paiement reçu", icon: Banknote },
  { key: "DONE", label: "Événement planifié", icon: PartyPopper },
];

const COMMANDE_STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  QUOTED: "bg-blue-50 text-blue-700",
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  READY: "bg-purple-50 text-purple-700",
  DELIVERED: "bg-emerald-800 text-white",
  CANCELLED: "bg-red-50 text-red-700",
};

export default function EventDetailView({ event }: { event: EventDetail }) {
  const { can } = useRole();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : null;

  const formatDate = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const sameDay = endDate && startDate.toDateString() === endDate.toDateString();

  const durationHours = endDate
    ? Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60) * 10) / 10
    : null;

  const statusIndex = STATUS_ORDER[event.status] ?? 0;
  const progressValue = event.status === "COMPLETED" ? 100
    : event.status === "CANCELLED" ? 0
    : Math.round((statusIndex / 4) * 100);
  const cancelled = event.status === "CANCELLED";

  const activities = useMemo(() => {
    const items: Array<{ icon: typeof Sparkles; label: string; time: string; color: string }> = [
      { icon: Sparkles, label: "Événement créé", time: formatDate(new Date(event.createdAt)), color: "text-emerald-600" },
    ];
    if (event.updatedAt && event.updatedAt !== event.createdAt) {
      items.push({
        icon: Pencil,
        label: "Informations mises à jour",
        time: formatDate(new Date(event.updatedAt)),
        color: "text-blue-600",
      });
    }
    if (event.client) {
      items.push({
        icon: Crown,
        label: `Client assigné : ${event.client.name}`,
        time: "",
        color: "text-[var(--gold-deep)]",
      });
    }
    if (!cancelled) {
      items.push({
        icon: statusIndex >= 3 ? CheckCircle2 : Hourglass,
        label: `Statut : ${STATUS_LABELS[event.status]}`,
        time: "",
        color: statusIndex >= 3 ? "text-emerald-600" : "text-amber-600",
      });
    } else {
      items.push({ icon: AlertTriangle, label: "Événement annulé", time: "", color: "text-red-600" });
    }
    return items;
  }, [event.createdAt, event.updatedAt, event.client, event.status, cancelled, statusIndex]);

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
              href="/dashboard/events"
              className="mt-2 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:size-10 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-foreground/[0.04] transition-colors shadow-soft shrink-0"
            >
              <ArrowLeft className="size-4 text-muted-foreground" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Sparkles className="size-3 text-[var(--gold-deep)]" />
                <span>Détail de l&apos;événement</span>
              </div>
              <h1 className="font-display text-4xl lg:text-5xl text-gradient-charcoal leading-[1.05]">
                {event.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`text-[11px] px-3 py-1 rounded-full font-medium ${STATUS_STYLES[event.status] || "bg-foreground/[0.05] text-muted-foreground"}`}>
                  {STATUS_LABELS[event.status] || event.status}
                </span>
                {event.type && (
                  <span className="text-[11px] px-3 py-1 rounded-full font-medium bg-foreground/[0.04] text-muted-foreground">
                    {TYPE_LABELS[event.type] || event.type}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {endDate && !sameDay
                    ? `${formatDate(startDate)} → ${formatDate(endDate)} • ${formatTime(startDate)} → ${formatTime(endDate)}`
                    : `${formatDate(startDate)} • ${formatTime(startDate)}${endDate ? ` → ${formatTime(endDate)}` : ''}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {can('events', 'update') && (
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
            {can('events', 'delete') && (
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

        {/* ==================== KPI CARDS ==================== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <KpiCard
            icon={Wallet}
            label="Budget"
            value={event.budget ? mad(Number(event.budget)) : "Budget non défini"}
            accent
          />
          <KpiCard
            icon={TableIcon}
            label="Tables"
            value={event.guestCount ? `${event.guestCount} tables` : "Non renseigné"}
          />
          <KpiCard
            icon={Hourglass}
            label="Durée"
            value={durationHours !== null ? `${durationHours}h` : "Non définie"}
          />
          <KpiCard
            icon={cancelled ? AlertTriangle : TrendingUp}
            label={cancelled ? "Annulé" : "Progression"}
            value={cancelled ? "—" : `${progressValue}%`}
            accent={!cancelled && progressValue > 50}
          />
        </motion.div>

        {/* ==================== MAIN GRID ==================== */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ---------- LEFT COLUMN (2/3) ---------- */}
          <div className="xl:col-span-2 space-y-6">

            {/* Event Information */}
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
                <InfoItem icon={PartyPopper} label="Type" value={event.type ? (TYPE_LABELS[event.type] || event.type) : "Aucun type renseigné"} />
                <InfoItem icon={MapPin} label="Lieu" value={event.location || "Aucun lieu renseigné"} />
                <InfoItem icon={Calendar} label="Date" value={formatDate(startDate)} />
                <InfoItem icon={Clock} label="Début" value={formatTime(startDate)} />
                <InfoItem icon={Clock} label="Fin" value={endDate ? formatTime(endDate) : "Non définie"} />
                <InfoItem icon={TableIcon} label="Tables" value={event.guestCount ? `${event.guestCount} tables` : "Non renseigné"} />
                {event.contactPerson && (
                  <InfoItem icon={User} label="Personne de contact" value={event.contactPerson} />
                )}
                {event.contactPhone && (
                  <InfoItem icon={Phone} label="Téléphone contact" value={event.contactPhone} />
                )}
                {!event.contactPerson && !event.contactPhone && (
                  <InfoItem icon={User} label="Contact" value="Aucun contact renseigné" />
                )}
              </div>
            </motion.div>

            {/* Budget Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl border border-border bg-card shadow-soft p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <Wallet className="size-4 text-muted-foreground" />
                <h3 className="font-display text-xl">Budget</h3>
              </div>
              {event.budget ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Budget prévu</span>
                    <span className="font-display text-2xl text-gradient-charcoal tabular-nums">{mad(Number(event.budget))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Acompte reçu</span>
                    <span className="font-medium tabular-nums text-emerald-600">{mad(0)}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Reste à payer</span>
                    <span className="font-display text-xl tabular-nums">{mad(Number(event.budget))}</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span>Progression financière</span>
                      <span>{progressValue}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-foreground/[0.05] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressValue}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center gap-3 text-muted-foreground">
                  <Wallet className="size-8 opacity-40" />
                  <p className="text-sm">Budget non défini</p>
                </div>
              )}
            </motion.div>

            {/* Notes */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-border bg-card shadow-soft p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <FileText className="size-4 text-muted-foreground" />
                <h3 className="font-display text-xl">Notes</h3>
              </div>
              {event.notes ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{event.notes}</p>
              ) : (
                <div className="py-8 flex flex-col items-center gap-3 text-muted-foreground">
                  <FileText className="size-8 opacity-40" />
                  <p className="text-sm">Aucune note associée à cet événement.</p>
                </div>
              )}
            </motion.div>

            {/* Related Orders */}
            {event.commandes && event.commandes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-2xl border border-border bg-card shadow-soft overflow-x-auto"
              >
                <div className="p-6 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Receipt className="size-4 text-muted-foreground" />
                    <h3 className="font-display text-xl">Commandes liées</h3>
                  </div>
                </div>
                <div className="min-w-[500px] divide-y divide-border">
                  <div className="grid grid-cols-12 px-6 py-3 text-[10px] uppercase tracking-wider text-muted-foreground bg-foreground/[0.02]">
                    <div className="col-span-4">Commande</div>
                    <div className="col-span-4 text-right">Montant</div>
                    <div className="col-span-4 text-right">Statut</div>
                  </div>
                  {event.commandes.map((c, i) => (
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
                          {c.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

          </div>

          {/* ---------- RIGHT COLUMN (1/3) ---------- */}
          <aside className="space-y-6">

            {/* Client Card */}
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
              {event.client ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-gradient-to-br from-[var(--gold-soft)] to-[var(--gold-deep)]/20 flex items-center justify-center text-sm font-medium text-[var(--gold-foreground)]">
                      {event.client.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <div className="font-medium">{event.client.name}</div>
                      <Link href={`/dashboard/clients/${event.client.id}`} className="text-xs text-[var(--gold-deep)] hover:underline inline-flex items-center gap-1">
                        Voir le profil <ChevronRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="space-y-3">
                    {event.client.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="size-3.5 text-muted-foreground shrink-0" />
                        <a href={`tel:${event.client.phone}`} className="hover:text-foreground transition-colors">{event.client.phone}</a>
                      </div>
                    )}
                    {event.client.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="size-3.5 text-muted-foreground shrink-0" />
                        <a href={`mailto:${event.client.email}`} className="hover:text-foreground transition-colors">{event.client.email}</a>
                      </div>
                    )}
                  </div>

                  {(event.contactPerson || event.contactPhone) && (
                    <>
                      <div className="h-px bg-border" />
                      <div className="space-y-3">
                        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Contact direct</div>
                        {event.contactPerson && (
                          <div className="flex items-center gap-3 text-sm">
                            <User className="size-3.5 text-muted-foreground shrink-0" />
                            <span>{event.contactPerson}</span>
                          </div>
                        )}
                        {event.contactPhone && (
                          <div className="flex items-center gap-3 text-sm">
                            <Phone className="size-3.5 text-muted-foreground shrink-0" />
                            <a href={`tel:${event.contactPhone}`} className="hover:text-foreground transition-colors">{event.contactPhone}</a>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center gap-3 text-muted-foreground">
                  <Crown className="size-8 opacity-40" />
                  <p className="text-sm">Aucun client assigné</p>
                </div>
              )}
            </motion.div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.17 }}
              className="rounded-2xl border border-border bg-card shadow-soft p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <CircleDot className="size-4 text-muted-foreground" />
                <h3 className="font-display text-xl">Avancement</h3>
              </div>
              {cancelled ? (
                <div className="py-6 flex flex-col items-center gap-3 text-red-500">
                  <AlertTriangle className="size-8" />
                  <p className="text-sm font-medium">Événement annulé</p>
                </div>
              ) : (
                <div className="relative space-y-0">
                  <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-border" />
                  {TIMELINE_STEPS.map((step, i) => {
                    const active = i <= statusIndex;
                    const current = i === statusIndex;
                    return (
                      <div key={step.key} className="relative flex items-start gap-4 pb-6 last:pb-0">
                        <div className={`relative z-10 size-6 rounded-full flex items-center justify-center shrink-0 transition-all
                          ${current ? "bg-[var(--gold-deep)] ring-4 ring-[var(--gold-soft)]" : active ? "bg-emerald-500" : "bg-foreground/[0.08]"}`}
                        >
                          {current ? (
                            <Loader2 className="size-3 text-white animate-spin" />
                          ) : active ? (
                            <CheckCircle2 className="size-3 text-white" />
                          ) : (
                            <div className="size-2 rounded-full bg-muted-foreground/40" />
                          )}
                        </div>
                        <div className="pt-1">
                          <div className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>
                            {step.label}
                          </div>
                          {current && (
                            <div className="text-[10px] text-[var(--gold-deep)] mt-0.5">En cours</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
            Mis à jour le {formatDate(new Date(event.updatedAt))}
          </div>
          <div>© TUR — Suite traiteur premium</div>
        </footer>
      </div>

      <EditEventDialog
        event={event}
        open={editOpen}
        onClose={setEditOpen}
        onSuccess={() => window.location.reload()}
      />
      <DeleteEventDialog
        event={event}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={() => { window.location.href = "/dashboard/events"; }}
      />
    </div>
  );
}

function TableIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 491.413 491.413" fill="currentColor" className={className}>
      <path d="M491.413,133.867c0-62.4-126.613-96.107-245.653-96.107S0,71.467,0,133.867c0,60.48,118.72,93.973,234.453,96v125.76c-0.213,0.747-0.533,1.387-0.853,2.133c-4.587,0.32-8.533,3.52-9.6,8.107c-1.173,4.16-2.773,8.107-4.8,11.947c-1.067,0.533-2.24,0.853-3.413,1.067c-12.373,1.6-30.08-17.707-36.693-27.307c-3.307-4.907-10.027-6.08-14.827-2.773s-6.08,10.027-2.773,14.827c2.347,3.413,20.373,29.013,42.987,35.2c-13.013,14.08-34.027,28.373-67.84,33.6c-5.867,0.853-9.813,6.293-8.96,12.16c0.747,5.227,5.333,9.067,10.56,9.067c0.533,0,1.067,0,1.6-0.107c56.853-8.64,83.733-39.68,95.787-61.227c3.627-3.093,6.827-6.613,9.387-10.667c2.56,3.947,5.76,7.573,9.387,10.667c12.16,21.547,39.04,52.587,95.893,61.227c0.533,0.107,1.067,0.107,1.6,0.107c5.867,0,10.667-4.8,10.667-10.667c0-5.333-3.84-9.813-9.067-10.56c-33.92-5.227-55.04-19.52-67.947-33.6c22.613-6.293,40.747-31.893,43.093-35.307c3.307-4.8,2.133-11.52-2.667-14.827s-11.52-2.133-14.827,2.773c-6.72,9.6-24.213,28.907-36.693,27.307c-1.173-0.213-2.347-0.533-3.413-1.067c-2.027-3.84-3.627-7.787-4.8-11.947c-1.173-4.587-5.12-7.787-9.707-8.107c-5.44-0.32-9.067-0.533-10.56-2.133v-125.76C372.693,227.84,491.413,194.347,491.413,133.867z M245.76,211.733c-113.173,0-192.853-31.04-204.8-77.867c11.947-46.827,91.627-77.867,204.8-77.867s192.853,31.04,204.8,77.867C438.613,180.693,358.933,211.733,245.76,211.733z" />
    </svg>
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