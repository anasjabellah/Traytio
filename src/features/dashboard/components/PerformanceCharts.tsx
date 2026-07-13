'use client';

import { memo, useMemo, useId } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Calendar, Users, CreditCard } from 'lucide-react';
import { mad } from '@/features/dashboard/constants';
import { computeKpi } from '@/features/dashboard/lib/kpi-engine';

const GOLD = 'oklch(0.72 0.13 78)';

function Sparkline({ data }: { data: number[] }) {
  const id = useId();
  const w = 400;
  const h = 28;
  const pad = 1;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(1, max - min);

  const pts = data.map((d, i) => {
    const x = i * ((w - pad * 2) / Math.max(1, data.length - 1)) + pad;
    const y = h - pad - ((d - min) / range) * (h - pad * 2);
    return [x, y];
  });

  const line = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${line} L${pts[pts.length - 1][0]},${h} L${pts[0][0]},${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.1" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const PerformanceCharts = memo(function PerformanceCharts({
  perfRevenue, perfEvents, perfClients, perfPayments,
  totalRevenue, confirmedEvents, upcomingEventsCount,
  activeClients, paymentsReceived,
}: {
  perfRevenue: number[];
  perfEvents: number[];
  perfClients: number[];
  perfPayments: number[];
  totalRevenue: number;
  confirmedEvents: number;
  upcomingEventsCount: number;
  activeClients: number;
  paymentsReceived: number;
}) {
  const cards = useMemo(() => {
    const revenueGrowth = computeKpi(perfRevenue).delta;
    const eventsGrowth = computeKpi(perfEvents).delta;
    const clientsGrowth = computeKpi(perfClients).delta;
    const paymentsGrowth = computeKpi(perfPayments).delta;

    const eventsTotal = perfEvents.reduce((s, v) => s + v, 0);

    const badge = (g: number) => {
      const up = g >= 0;
      return {
        cls: up ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50',
        txt: g >= 0 ? `+${g}%` : `${g}%`,
      };
    };

    return [
      {
        icon: Wallet,
        label: 'Revenu',
        value: mad(totalRevenue),
        badge: badge(revenueGrowth),
        secondary: null,
        progress: undefined,
        data: perfRevenue,
      },
      {
        icon: Calendar,
        label: '\u00c9v\u00e9nements',
        value: eventsTotal.toLocaleString('fr-FR'),
        badge: badge(eventsGrowth),
        secondary: null,
        progress: undefined,
        data: perfEvents,
      },
      {
        icon: Users,
        label: 'Clients',
        value: activeClients.toLocaleString('fr-FR'),
        badge: badge(clientsGrowth),
        secondary: null,
        progress: undefined,
        data: perfClients,
      },
      {
        icon: CreditCard,
        label: 'Paiements',
        value: mad(paymentsReceived),
        badge: badge(paymentsGrowth),
        secondary: null,
        progress: undefined,
        data: perfPayments,
      },
    ];
  }, [perfRevenue, perfEvents, perfClients, perfPayments, totalRevenue, confirmedEvents, upcomingEventsCount, activeClients, paymentsReceived]);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Performance
          </div>
          <h3 className="font-display text-2xl mt-1">
            Vue d&apos;ensemble &mdash; 8 derniers mois
          </h3>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, ci) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ci * 0.08 }}
            className="group relative flex flex-col rounded-xl border border-border bg-[var(--surface-elevated)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2.5">
              <c.icon className="size-4 text-muted-foreground/60" />
              <span className="text-xs text-muted-foreground font-medium tracking-wide">
                {c.label}
              </span>
            </div>

            <div className="font-display text-xl sm:text-2xl font-semibold tabular-nums text-foreground leading-none truncate">
              {c.value}
            </div>

            <div className="flex items-center gap-1.5 mt-2">
              <span className={`inline-flex items-center text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded-md ${c.badge.cls}`}>
                {c.badge.txt}
              </span>
              <span className="text-[10px] text-muted-foreground/50 font-normal">
                vs p&eacute;riode pr&eacute;c&eacute;dente
              </span>
            </div>

            {c.secondary && (
              <div className="mt-2.5">
                {c.secondary}
              </div>
            )}

            {c.progress !== undefined && (
              <div className="mt-2.5 h-1 rounded-full bg-foreground/[0.06] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(c.progress, 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + ci * 0.08, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-gold"
                />
              </div>
            )}

            <div className="flex-1" />

            <div className="mt-3 h-7 overflow-hidden">
              <Sparkline data={c.data} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});
