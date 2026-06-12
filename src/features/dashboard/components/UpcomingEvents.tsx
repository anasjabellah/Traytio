'use client';

import { memo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PartyPopper, Users, ArrowRight } from 'lucide-react';
import { EVENT_STATUS_LABELS, EVENT_STATUS_STYLES } from '@/features/dashboard/constants';
import type { DashboardData } from '@/features/dashboard/types';

export const UpcomingEvents = memo(function UpcomingEvents({ events }: { events: DashboardData['upcomingEvents'] }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Agenda</div>
          <h3 className="font-display text-2xl mt-1">Prochains &eacute;v&eacute;nements</h3>
        </div>
        <Link href="/dashboard/events" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          Tout voir <ArrowRight className="size-3" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {events.length === 0 && (
          <div className="col-span-3 py-8 text-center text-sm text-muted-foreground">Aucun &eacute;v&eacute;nement &agrave; venir</div>
        )}
        {events.map((e, i) => {
          const daysUntil = Math.ceil((new Date(e.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const accent = e.status === 'CONFIRMED';
          return (
            <motion.div key={e.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={`group relative rounded-xl border p-5 overflow-hidden transition-all hover:shadow-lift ${accent ? "border-gold bg-gradient-to-br from-[var(--gold-soft)]/60 to-transparent" : "border-border bg-card"}`}>
              {accent && <div className="absolute -top-12 -right-12 size-32 rounded-full bg-gradient-gold opacity-20 blur-2xl" />}
              <div className="flex items-start justify-between">
                <PartyPopper className={`size-5 ${accent ? "text-[var(--gold-deep)]" : "text-muted-foreground"}`} />
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${EVENT_STATUS_STYLES[e.status] || "bg-foreground/[0.05] text-muted-foreground"}`}>
                  {EVENT_STATUS_LABELS[e.status] || e.status}
                </span>
              </div>
              <div className="mt-4 font-display text-xl leading-tight">{e.name}</div>
              {e.clientName && <div className="mt-1 text-xs text-muted-foreground">{e.clientName}</div>}
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {new Date(e.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                {e.guestCount && (
                  <span className="inline-flex items-center gap-1 text-foreground">
                    <Users className="size-3" /> {e.guestCount}
                  </span>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Dans</span>
                <span className="font-display text-2xl tabular-nums">
                  {daysUntil < 0 ? 0 : daysUntil}
                  <span className="text-xs text-muted-foreground ml-1">jour{daysUntil > 1 ? 's' : ''}</span>
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});
