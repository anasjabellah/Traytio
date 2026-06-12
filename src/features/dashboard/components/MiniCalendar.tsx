'use client';

import { memo } from 'react';
import { CALENDAR_DAYS, CALENDAR_EVENTS } from '@/features/dashboard/constants';

export const MiniCalendar = memo(function MiniCalendar() {
  const today = 5;
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Calendrier</div>
          <h3 className="font-display text-2xl mt-1">Aper&ccedil;u</h3>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-[10px] uppercase text-muted-foreground text-center mb-2">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {CALENDAR_DAYS.map((d, i) => {
          const valid = d > 0 && d <= 30;
          const ev = CALENDAR_EVENTS[d];
          const isToday = d === today;
          return (
            <div key={i}
              className={`relative aspect-square rounded-lg text-xs flex items-center justify-center cursor-pointer transition-all
                ${!valid ? "opacity-0" : ""}
                ${isToday ? "bg-foreground text-background font-medium" : "hover:bg-foreground/[0.04]"}
                ${ev === "busy" && !isToday ? "bg-[var(--gold-soft)]" : ""}
                ${ev === "warning" && !isToday ? "bg-rose-50 ring-1 ring-rose-200" : ""}
              `}>
              {valid && d}
              {ev && !isToday && (
                <span className={`absolute bottom-1 size-1 rounded-full ${ev === "booked" ? "bg-emerald-500" : ev === "busy" ? "bg-[var(--gold-deep)]" : "bg-rose-500"}`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-500" /> R&eacute;serv&eacute;</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[var(--gold-deep)]" /> Charg&eacute;</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-rose-500" /> Conflit</span>
      </div>
    </div>
  );
});
