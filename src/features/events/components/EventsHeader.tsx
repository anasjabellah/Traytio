'use client';

import { Sparkles, Plus, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EyeToggle } from '@/components/privacy-mode';
import type { Event } from '@/features/events/types';

export function EventsHeader({
  total, events, onCalendar, onCreate,
}: {
  total: number; events: Event[]; onCalendar: () => void; onCreate: () => void;
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Sparkles className="size-3.5 text-[var(--gold-deep)]" />
          <span>Gestion des événements • {total} au total</span>
        </div>
        <h1 className="font-display text-5xl lg:text-6xl text-gradient-charcoal leading-[1.05]">
          Événements
        </h1>
        <p className="mt-3 text-muted-foreground max-w-xl">
          Créez, planifiez et suivez l&apos;ensemble de vos événements traiteur en un coup d&apos;œil.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" className="h-10 rounded-lg border-border bg-background/60 backdrop-blur" onClick={onCalendar}>
          <CalendarIcon className="size-4" /> Calendrier
        </Button>
        <Button variant="outline" className="h-10 rounded-lg border-border bg-background/60 backdrop-blur" onClick={() => {
          const csv = events.map(e => `${e.name},${e.status},${new Date(e.startDate).toISOString()},${e.guestCount ?? 0},${Number(e.budget ?? 0)},${e.paymentStatus ?? ''}`).join('\n');
          const blob = new Blob(['Nom,Statut,Date,Invites,Budget,Paiement\n' + csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = 'evenements.csv'; a.click();
          URL.revokeObjectURL(url);
        }}>
          <FileText className="size-4" /> Exporter
        </Button>
        <EyeToggle />
        <Button onClick={onCreate} className="h-10 rounded-lg bg-gradient-charcoal text-white shadow-lift hover:opacity-95">
          <Plus className="size-4" /> Nouvel événement
        </Button>
      </div>
    </div>
  );
}
