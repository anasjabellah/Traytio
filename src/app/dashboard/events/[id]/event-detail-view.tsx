"use client"

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Trash2, Calendar, MapPin, Users, Wallet,
  Sparkles, Clock, FileText, PartyPopper, CheckCircle2, Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditEventDialog } from "@/features/events/components/edit-event-dialog";
import { DeleteEventDialog } from "@/features/events/components/delete-event-dialog";
import type { Event } from "@/features/events/types";

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

export default function EventDetailView({ event }: { event: Event }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--surface-soft)] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-radiance" />

      <div className="relative mx-auto max-w-[1480px] px-6 py-8 lg:px-10">

        {/* Back + header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard/events"
            className="size-9 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-foreground/[0.04] transition-colors"
          >
            <ArrowLeft className="size-4 text-muted-foreground" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Sparkles className="size-3 text-[var(--gold-deep)]" />
              <span>Détail de l&apos;événement</span>
            </div>
            <h1 className="font-display text-4xl lg:text-5xl text-gradient-charcoal leading-[1.05]">
              {event.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-xl border-border"
              onClick={() => setEditOpen(true)}
              title="Modifier"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-xl border-border text-muted-foreground hover:text-red-600 hover:border-red-200 hover:bg-red-50"
              onClick={() => setDeleteOpen(true)}
              title="Supprimer"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        {/* Status + Type badges */}
        <div className="flex items-center gap-2 mb-8">
          <span className={`text-[11px] px-3 py-1 rounded-full font-medium ${STATUS_STYLES[event.status] || "bg-foreground/[0.05] text-muted-foreground"}`}>
            {STATUS_LABELS[event.status] || event.status}
          </span>
          {event.type && (
            <span className="text-[11px] px-3 py-1 rounded-full font-medium bg-foreground/[0.04] text-muted-foreground">
              {event.type}
            </span>
          )}
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <InfoCard icon={Calendar} label="Date de début" value={new Date(event.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} />
          <InfoCard icon={Clock} label="Date de fin" value={event.endDate ? new Date(event.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "Non définie"} />
          <InfoCard icon={MapPin} label="Lieu" value={event.location || "Non défini"} />
          <InfoCard icon={Wallet} label="Budget" value={event.budget ? mad(Number(event.budget)) : "Non défini"} accent />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <InfoCard icon={Users} label="Nombre d'invités" value={event.guestCount ? `${event.guestCount} pax` : "Non défini"} />
          <InfoCard icon={Crown} label="Client" value={
            event.clientId ? (
              <a href={`/dashboard/clients/${event.clientId}`} className="text-[var(--gold-deep)] hover:underline">
                Voir le client
              </a>
            ) : "Non assigné"
          } />
          <InfoCard icon={FileText} label="Type d'événement" value={event.type || "Non défini"} />
        </div>

        {/* Notes */}
        <div className="rounded-2xl border border-border bg-card shadow-soft p-6 mb-8">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Notes</div>
          <p className="text-sm leading-relaxed">{event.notes || "Aucune note associée à cet événement."}</p>
        </div>

        {/* Commands */}
        {(event as any).commandes && (event as any).commandes.length > 0 && (
          <div className="rounded-2xl border border-border bg-card shadow-soft p-6 mb-8">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">Commandes liées</div>
            <div className="space-y-3">
              {(event as any).commandes.map((c: any) => (
                <div key={c.id} className="rounded-xl border border-border bg-[var(--surface-elevated)] p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">#{c.number || c.id.slice(0, 8)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString("fr-FR") : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium tabular-nums">{c.totalAmount ? mad(Number(c.totalAmount)) : ""}</div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/[0.05] text-muted-foreground">{c.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

function InfoCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: any; accent?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl border p-5 shadow-soft ${accent ? "border-gold bg-card" : "border-border bg-card"}`}
    >
      {accent && (
        <div className="pointer-events-none absolute -top-12 -right-12 size-32 rounded-full bg-gradient-gold opacity-20 blur-2xl" />
      )}
      <div className="flex items-start justify-between mb-3">
        <div className={`size-9 rounded-xl flex items-center justify-center ${accent ? "bg-gradient-gold text-[var(--gold-foreground)]" : "bg-foreground/[0.04] text-foreground"}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </motion.div>
  );
}
