import React from 'react';
import { CheckCircle2, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import type { ConflictEventInfo } from '@/features/events/actions/check-event-conflicts';

type AvailabilityState = 'idle' | 'checking' | 'available' | 'noConflict' | 'conflict';

type AvailabilityCardProps = {
  state: AvailabilityState;
  conflictingEvents?: ConflictEventInfo[];
  sameDayEvents?: ConflictEventInfo[];
};

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function AvailabilityCard({
  state,
  conflictingEvents = [],
  sameDayEvents = [],
}: AvailabilityCardProps) {
  if (state === 'idle') return null;

  if (state === 'checking') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-soft p-4">
        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
        <div>
          <div className="text-sm font-medium">Vérification des disponibilités...</div>
        </div>
      </div>
    );
  }

  const isGreen = state === 'available';
  const isYellow = state === 'noConflict';
  const isRed = state === 'conflict';

  const borderColor = isGreen ? 'border-emerald-200' : isYellow ? 'border-amber-300' : 'border-red-300';
  const bgColor = isGreen ? 'bg-emerald-50/50' : isYellow ? 'bg-amber-50/60' : 'bg-red-50/50';
  const iconBg = isGreen ? 'bg-emerald-500' : isYellow ? 'bg-amber-500' : 'bg-red-500';
  const Icon = isGreen ? CheckCircle2 : isYellow ? Clock : AlertTriangle;

  const events = isRed ? conflictingEvents : sameDayEvents;

  return (
    <div className={`flex items-start gap-3 rounded-2xl border ${borderColor} ${bgColor} p-4`}>
      <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${iconBg} text-white`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">
          {isGreen && 'Date disponible'}
          {isYellow && `${sameDayEvents.length} événement${sameDayEvents.length > 1 ? 's' : ''} programmé${sameDayEvents.length > 1 ? 's' : ''} ce jour`}
          {isRed && `Conflit détecté avec ${conflictingEvents.length} événement${conflictingEvents.length > 1 ? 's' : ''}`}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {isGreen && 'Aucun conflit dans votre planning équipe & logistique.'}
          {isYellow && 'Aucun chevauchement horaire détecté.'}
          {isRed && "Cet événement chevauche des événements existants. Vérifiez votre planning avant confirmation."}
        </div>

        {events.length > 0 && (
          <ul className="mt-2 space-y-1">
            {events.map((ev) => (
              <li key={ev.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-current shrink-0" />
                <span className="truncate">{ev.name}</span>
                <span className="shrink-0 tabular-nums">
                  {formatTime(ev.startDate)}
                  {ev.endDate ? ` - ${formatTime(ev.endDate)}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
