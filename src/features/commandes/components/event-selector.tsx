"use client"

import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Plus, ArrowRight } from "lucide-react";
import type { ClientEventSummary } from "@/features/commandes/actions/get-commande-client-events";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon", PLANNED: "Planifié", CONFIRMED: "Confirmé",
  IN_PROGRESS: "En cours", COMPLETED: "Terminé", CANCELLED: "Annulé",
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PLANNED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-surface-soft text-muted-foreground",
  CANCELLED: "bg-red-100 text-red-700",
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export function EventSelector({
  events, onSelect, onCreateNew,
}: {
  events: ClientEventSummary[];
  onSelect: (event: ClientEventSummary) => void;
  onCreateNew: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Événements existants
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {events.length} événement{events.length > 1 ? "s" : ""} trouvé{events.length > 1 ? "s" : ""} pour ce client
          </p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {events.map((event) => (
          <motion.button
            key={event.id}
            whileHover={{ y: -2 }}
            onClick={() => onSelect(event)}
            className="relative text-left rounded-2xl border border-border bg-card p-5 hover:border-gold/40 hover:shadow-soft transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-display text-lg">{event.name}</div>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  {formatDate(event.startDate)}
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                )}
                {event.guestCount && (
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    {event.guestCount} invités
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${STATUS_STYLE[event.status] ?? ""}`}>
                  {STATUS_LABEL[event.status] ?? event.status}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </motion.button>
        ))}
        <motion.button
          whileHover={{ y: -2 }}
          onClick={onCreateNew}
          className="rounded-2xl border-2 border-dashed border-border bg-surface-soft p-5 hover:border-gold/40 hover:bg-card transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-6 w-6" />
          <span className="text-sm font-medium">Créer un nouvel événement</span>
        </motion.button>
      </div>
    </div>
  );
}
