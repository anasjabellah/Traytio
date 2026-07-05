'use client';

import { CalendarDays, Calendar, BarChart3, Clock, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCounter } from '@/shared/hooks/use-counter';
import { SensitiveValue } from '@/components/privacy-mode';

const CARDS = [
  {
    key: 'totalToday' as const,
    label: "Aujourd'hui",
    icon: CalendarDays,
    accent: true,
  },
  {
    key: 'totalWeek' as const,
    label: 'Cette semaine',
    icon: Calendar,
    accent: false,
  },
  {
    key: 'totalMonth' as const,
    label: 'Ce mois',
    icon: BarChart3,
    accent: false,
  },
];

function InsightToday() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-[11px] text-muted-foreground/60">En direct</span>
    </div>
  );
}

function InsightWeek({ total }: { total: number }) {
  const daysThisWeek = Math.max(1, new Date().getDay() + 1);
  const avg = Math.round(total / daysThisWeek);
  if (total === 0) return <div className="h-[18px]" />;
  return (
    <div className="flex items-center gap-1.5">
      <Clock className="size-3 text-muted-foreground/40" strokeWidth={1.5} />
      <span className="text-[11px] text-muted-foreground/60">
        Moy. {avg.toLocaleString('fr-FR')}/jour
      </span>
    </div>
  );
}

function InsightMonth({ today, week }: { today: number; week: number }) {
  if (today === 0 || week === 0) return <div className="h-[18px]" />;
  const pct = Math.round((today / week) * 100);
  return (
    <div className="flex items-center gap-1.5">
      <Activity className="size-3 text-muted-foreground/40" strokeWidth={1.5} />
      <span className="text-[11px] text-muted-foreground/60">
        {pct}% cette semaine
      </span>
    </div>
  );
}

export function ActivityStats({
  stats,
}: {
  stats: { totalToday: number; totalWeek: number; totalMonth: number };
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {CARDS.map((card, i) => {
        const value = stats[card.key];
        const counted = useCounter(value, 1400);
        const display = Math.round(counted).toLocaleString('fr-FR');
        const Icon = card.icon;

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: i * 0.05,
              ease: [0.22, 1, 0.36, 1] as const,
            }}
            className={`group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-soft hover:shadow-lift transition-all ${
              card.accent ? 'border-gold' : 'border-border'
            }`}
          >
            {card.accent && (
              <div className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full bg-gradient-gold opacity-20 blur-2xl" />
            )}

            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </div>
                <div className="mt-3 font-display text-lg sm:text-xl lg:text-2xl xl:text-lg tabular-nums">
                  <SensitiveValue
                    hidden={false}
                    className="text-gradient-charcoal"
                  >
                    {display}
                  </SensitiveValue>
                </div>
              </div>
              <div
                className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                  card.accent
                    ? 'bg-gradient-gold text-[var(--gold-foreground)]'
                    : 'bg-foreground/[0.04] text-foreground'
                }`}
              >
                <Icon className="size-5" />
              </div>
            </div>

            {/* Bottom insight section — replaces sparkline + trend badge */}
            <div className="mt-4 flex items-center">
              {card.key === 'totalToday' && <InsightToday />}
              {card.key === 'totalWeek' && <InsightWeek total={stats.totalWeek} />}
              {card.key === 'totalMonth' && (
                <InsightMonth today={stats.totalToday} week={stats.totalWeek} />
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
