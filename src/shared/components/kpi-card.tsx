'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useCounter } from '@/shared/hooks/use-counter';
import { SensitiveValue, usePrivacyMode } from '@/components/privacy-mode';

/**
 * Formats a number as MAD currency.
 */
export function formatMAD(n: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0,
  }).format(n);
}

// ---------------------------------------------------------------------------
// Sparkline
// ---------------------------------------------------------------------------

export const Sparkline = memo(function Sparkline({
  data,
  up,
  id,
}: {
  data: number[];
  up: boolean;
  /** Unique id to prevent SVG gradient collisions when multiple sparklines are rendered. */
  id: string;
}) {
  const w = 96,
    h = 32,
    pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data.map((d, i) => {
    const x = pad + (i * (w - pad * 2)) / (data.length - 1);
    const y = h - pad - ((d - min) / Math.max(1, max - min)) * (h - pad * 2);
    return [x, y];
  });
  const path = pts
    .map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`))
    .join(' ');
  const fillArea = `${path} L${w - pad},${h} L${pad},${h} Z`;
  const stroke = up ? 'rgb(16 185 129)' : 'rgb(244 63 94)';
  const gradientId = `sg-${id}`;

  return (
    <svg width={w} height={h} className="overflow-visible" aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillArea} fill={`url(#${gradientId})`} />
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

// ---------------------------------------------------------------------------
// KpiCard
// ---------------------------------------------------------------------------

export type KpiCardProps = {
  label: string;
  value: number;
  /** When set, the value is displayed as MAD currency. */
  prefix?: string;
  /** Percentage change (e.g. 12.5). */
  delta: number;
  trend: 'up' | 'down';
  spark: number[];
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
  delay?: number;
  sensitive?: boolean;
  /** Secondary info rendered below the value (e.g. "6 confirmés · 3 à venir"). */
  secondary?: React.ReactNode;
  /** Collection rate 0-100 shown as a thin progress bar. */
  progress?: number;
};

export function KpiCard({
  label,
  value,
  prefix,
  delta,
  trend,
  spark,
  icon: Icon,
  accent = false,
  delay = 0,
  sensitive = false,
  secondary,
  progress,
}: KpiCardProps) {
  const counted = useCounter(value, 1400);
  const display = prefix
    ? formatMAD(Math.round(counted))
    : Math.round(counted).toLocaleString('fr-FR');
  const up = trend === 'up';
  const { isPrivacyMode } = usePrivacyMode();
  const sparkId = `kpi-${label.normalize('NFD').replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase()}`;
  const hasExtraContent = !!secondary || progress !== undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.22, 1, 0.36, 1] as const,
      }}
      className={`group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-soft hover:shadow-lift transition-all ${
        accent ? 'border-gold' : 'border-border'
      }`}
    >
      {accent && (
        <div className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full bg-gradient-gold opacity-20 blur-2xl" />
      )}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-3 font-display text-lg sm:text-xl lg:text-2xl xl:text-lg tabular-nums">
            <SensitiveValue
              hidden={sensitive && isPrivacyMode}
              className="text-gradient-charcoal"
            >
              {display}
            </SensitiveValue>
          </div>
        </div>
        <div
          className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
            accent
              ? 'bg-gradient-gold text-[var(--gold-foreground)]'
              : 'bg-foreground/[0.04] text-foreground'
          }`}
        >
          <Icon className="size-5" />
        </div>
      </div>

      {secondary && (
        <div className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
          {secondary}
        </div>
      )}

      {progress !== undefined && (
        <div className="mt-2 h-[3px] rounded-full bg-foreground/[0.06] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-gold"
          />
        </div>
      )}

      <div className={`flex items-end justify-between gap-3 ${hasExtraContent ? 'mt-3' : 'mt-4'}`}>
        <div
          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${
            up
              ? 'text-emerald-700 bg-emerald-50'
              : 'text-rose-700 bg-rose-50'
          }`}
        >
          {up ? (
            <TrendingUp className="size-3" />
          ) : (
            <TrendingDown className="size-3" />
          )}
          {delta > 0 ? '+' : ''}
          {delta}%
        </div>
        <Sparkline data={spark} up={up} id={sparkId} />
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// KpiGrid — renders a list of KpiCards
// ---------------------------------------------------------------------------

export function KpiGrid({
  kpis,
  columns = 5,
}: {
  kpis: KpiCardProps[];
  columns?: 2 | 3 | 4 | 5;
}) {
  const colClass: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
  };

  return (
    <div className={`mt-10 grid ${colClass[columns] || colClass[5]} gap-4`}>
      {kpis.map((k, i) => (
        <KpiCard key={k.label} {...k} delay={i * 0.05} />
      ))}
    </div>
  );
}
