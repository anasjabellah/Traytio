"use client"

import React, { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, Wallet, Phone, CheckCircle2, AlertTriangle, Minus, Plus } from "lucide-react";
import { EVENT_TYPES } from "@/features/commandes/data/mock-data";
import { PremiumField } from "./premium-field";

function TableIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 491.413 491.413" fill="currentColor" className={className}>
      <path d="M491.413,133.867c0-62.4-126.613-96.107-245.653-96.107S0,71.467,0,133.867c0,60.48,118.72,93.973,234.453,96v125.76
        c-0.213,0.747-0.533,1.387-0.853,2.133c-4.587,0.32-8.533,3.52-9.6,8.107c-1.173,4.16-2.773,8.107-4.8,11.947
        c-1.067,0.533-2.24,0.853-3.413,1.067c-12.373,1.6-30.08-17.707-36.693-27.307c-3.307-4.907-10.027-6.08-14.827-2.773
        c-4.8,3.307-6.08,10.027-2.773,14.827c2.347,3.413,20.373,29.013,42.987,35.2c-13.013,14.08-34.027,28.373-67.84,33.6
        c-5.867,0.853-9.813,6.293-8.96,12.16c0.747,5.227,5.333,9.067,10.56,9.067c0.533,0,1.067,0,1.6-0.107
        c56.853-8.64,83.733-39.68,95.787-61.227c3.627-3.093,6.827-6.613,9.387-10.667c2.56,3.947,5.76,7.573,9.387,10.667
        c12.16,21.547,39.04,52.587,95.893,61.227c0.533,0.107,1.067,0.107,1.6,0.107c5.867,0,10.667-4.8,10.667-10.667
        c0-5.333-3.84-9.813-9.067-10.56c-33.92-5.227-55.04-19.52-67.947-33.6c22.613-6.293,40.747-31.893,43.093-35.307
        c3.307-4.8,2.133-11.52-2.667-14.827c-4.8-3.307-11.52-2.133-14.827,2.773c-6.72,9.6-24.213,28.907-36.693,27.307
        c-1.173-0.213-2.347-0.533-3.413-1.067c-2.027-3.84-3.627-7.787-4.8-11.947c-1.173-4.587-5.12-7.787-9.707-8.107
        c-5.44-0.32-9.067-0.533-10.56-2.133v-125.76C372.693,227.84,491.413,194.347,491.413,133.867z M245.76,211.733
        c-113.173,0-192.853-31.04-204.8-77.867c11.947-46.827,91.627-77.867,204.8-77.867s192.853,31.04,204.8,77.867
        C438.613,180.693,358.933,211.733,245.76,211.733z" />
    </svg>
  );
}

const STATUS_KEYS = ['DRAFT', 'PLANNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon', PLANNED: 'Planifié', CONFIRMED: 'Confirmé',
  IN_PROGRESS: 'En cours', COMPLETED: 'Terminé', CANCELLED: 'Annulé',
};

export function EventStep({
  eventName, setEventName, eventType, setEventType, eventDate, setEventDate,
  startTime, setStartTime, endTime, setEndTime, location, setLocation,
  guests, setGuests, budget, setBudget, eventStatus, setEventStatus,
  contactPerson, setContactPerson,
  contactPhone, setContactPhone, eventNotes, setEventNotes, dateAvailable,
}: {
  eventName: string; setEventName: Dispatch<SetStateAction<string>>;
  eventType: string; setEventType: Dispatch<SetStateAction<string>>;
  eventDate: string; setEventDate: Dispatch<SetStateAction<string>>;
  startTime: string; setStartTime: Dispatch<SetStateAction<string>>;
  endTime: string; setEndTime: Dispatch<SetStateAction<string>>;
  location: string; setLocation: Dispatch<SetStateAction<string>>;
  guests: number; setGuests: Dispatch<SetStateAction<number>>;
  budget: number; setBudget: Dispatch<SetStateAction<number>>;
  eventStatus: string | null; setEventStatus: Dispatch<SetStateAction<string | null>>;
  contactPerson: string; setContactPerson: Dispatch<SetStateAction<string>>;
  contactPhone: string; setContactPhone: Dispatch<SetStateAction<string>>;
  eventNotes: string; setEventNotes: Dispatch<SetStateAction<string>>;
  dateAvailable: boolean;
}) {

  const [guestCountDraft, setGuestCountDraft] = useState<string>(String(guests ?? 10));

  useEffect(() => {
    setGuestCountDraft(String(guests ?? 10));
  }, [guests]);

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <PremiumField label="Nom de l'événement" value={eventName} onChange={setEventName} placeholder="Nom de l'événement" />
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

      <div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Statut de l'événement</div>
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-border bg-surface-soft p-1.5">
          {STATUS_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setEventStatus(key)}
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${(eventStatus ?? 'CONFIRMED') === key ? 'bg-foreground text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {STATUS_LABELS[key]}
            </button>
          ))}
        </div>
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
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Nombre de tables</div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface-soft px-4 h-14">
            <TableIcon className="size-4 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const current = parseInt(guestCountDraft, 10) || 10;
                  const next = Math.max(1, current - 10);
                  setGuests(next);
                  setGuestCountDraft(String(next));
                }}
                className="h-7 w-7 rounded-full hover:bg-secondary flex items-center justify-center"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                type="text"
                inputMode="numeric"
                value={guestCountDraft}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  if (raw.length > 4) return;
                  setGuestCountDraft(raw);
                }}
                onBlur={() => {
                  const draft = guestCountDraft;
                  if (draft === '') {
                    setGuests(10);
                    setGuestCountDraft('10');
                  } else {
                    const num = parseInt(draft, 10);
                    if (num < 1) { setGuests(1); setGuestCountDraft('1'); }
                    else if (num > 1000) { setGuests(1000); setGuestCountDraft('1000'); }
                    else { setGuests(num); }
                  }
                }}
                className="font-display text-2xl font-semibold tabular-nums w-16 text-center bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => {
                  const current = parseInt(guestCountDraft, 10) || 10;
                  const next = Math.min(1000, current + 10);
                  setGuests(next);
                  setGuestCountDraft(String(next));
                }}
                className="h-7 w-7 rounded-full hover:bg-secondary flex items-center justify-center"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground">tables</span>
          </div>
        </div>
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
