"use client"

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, Users, Wallet, Phone, CheckCircle2, AlertTriangle, Minus, Plus } from "lucide-react";
import { EVENT_TYPES } from "@/features/commandes/data/mock-data";
import { PremiumField } from "./premium-field";

export function EventStep(props: any) {
  const {
    eventName, setEventName, eventType, setEventType, eventDate, setEventDate,
    startTime, setStartTime, endTime, setEndTime, location, setLocation,
    guests, setGuests, budget, setBudget, contactPerson, setContactPerson,
    contactPhone, setContactPhone, eventNotes, setEventNotes, dateAvailable,
  } = props;

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <PremiumField label="Nom de l'événement" value={eventName} onChange={setEventName} placeholder="Mariage Lambert" />
        <label className="block">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Type d'événement</div>
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-border bg-surface-soft p-1.5">
            {EVENT_TYPES.map((t: string) => (
              <button
                key={t}
                onClick={() => setEventType(t)}
                className={`px-3 py-1.5 rounded-full text-xs transition-all ${eventType === t ? "bg-foreground text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </label>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <PremiumField label="Date" value={eventDate} onChange={setEventDate} type="date" icon={<Calendar className="h-4 w-4" />} />
        <PremiumField label="Début" value={startTime} onChange={setStartTime} type="time" icon={<Clock className="h-4 w-4" />} />
        <PremiumField label="Fin" value={endTime} onChange={setEndTime} type="time" icon={<Clock className="h-4 w-4" />} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={dateAvailable ? "ok" : "warn"}
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          className={`flex items-start gap-3 rounded-2xl border p-4 ${
            dateAvailable ? "border-emerald-200 bg-emerald-50/50" : "border-amber-300 bg-amber-50/60"
          }`}
        >
          <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
            dateAvailable ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
          }`}>
            {dateAvailable ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          </div>
          <div>
            <div className="text-sm font-medium">
              {dateAvailable ? "Date disponible" : "2 événements déjà programmés ce jour"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {dateAvailable
                ? "Aucun conflit dans votre planning équipe & logistique."
                : "Vérifiez la disponibilité de votre équipe avant confirmation."}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <PremiumField label="Lieu" value={location} onChange={setLocation} placeholder="Adresse, salle, château…" icon={<MapPin className="h-4 w-4" />} />

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Nombre d'invités</div>
          <div className="flex items-center justify-between rounded-2xl border border-border bg-surface-soft px-4 py-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <button onClick={() => setGuests(Math.max(1, guests - 10))} className="h-7 w-7 rounded-full hover:bg-secondary flex items-center justify-center">
              <Minus className="h-3.5 w-3.5" />
            </button>
            <motion.span key={guests} initial={{ y: -3, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-2xl tabular-nums">
              {guests}
            </motion.span>
            <button onClick={() => setGuests(guests + 10)} className="h-7 w-7 rounded-full hover:bg-secondary flex items-center justify-center">
              <Plus className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs text-muted-foreground">pax</span>
          </div>
        </label>
        <PremiumField label="Budget client" value={budget} onChange={(v) => setBudget(parseInt(v) || 0)} type="number" prefix="MAD" icon={<Wallet className="h-4 w-4" />} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <PremiumField label="Personne de contact" value={contactPerson} onChange={setContactPerson} placeholder="Nom du contact sur place" />
        <PremiumField label="Téléphone contact" value={contactPhone} onChange={setContactPhone} placeholder="+33 6 …" icon={<Phone className="h-4 w-4" />} />
      </div>

      <PremiumField label="Notes" value={eventNotes} onChange={setEventNotes} placeholder="Détails logistiques, demandes spéciales…" multiline />
    </div>
  );
}
