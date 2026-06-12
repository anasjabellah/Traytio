'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { SensitiveValue, usePrivacyMode } from '@/components/privacy-mode';
import { useCounter } from '@/features/events/hooks/use-events-stats';
import { formatCurrency } from '@/lib/utils';

const mad = (n: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n);

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const w = 96, h = 32, pad = 2;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((d, i) => {
    const x = pad + (i * (w - pad * 2)) / (data.length - 1);
    const y = h - pad - ((d - min) / Math.max(1, max - min)) * (h - pad * 2);
    return [x, y];
  });
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const fill = `${path} L${w - pad},${h} L${pad},${h} Z`;
  const stroke = up ? 'rgb(16 185 129)' : 'rgb(244 63 94)';
  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${up ? 'u' : 'd'}-ev`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#sg-${up ? 'u' : 'd'}-ev)`} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KpiCard({ label, value, prefix, delta, trend, spark, icon: Icon, accent, delay, sensitive }: {
  label: string; value: number; prefix?: string; delta: number; trend: 'up' | 'down';
  spark: number[]; icon: React.ComponentType<{ className?: string }>; accent?: boolean; delay: number; sensitive: boolean;
}) {
  const counted = useCounter(value, 1400);
  const display = prefix ? mad(Math.round(counted)) : Math.round(counted).toLocaleString('fr-FR');
  const up = trend === 'up';
  const { isPrivacyMode } = usePrivacyMode();
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-soft hover:shadow-lift transition-all ${accent ? 'border-gold' : 'border-border'}`}
    >
      {accent && (
        <div className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full bg-gradient-gold opacity-20 blur-2xl" />
      )}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-3 font-display text-4xl tabular-nums">
            <SensitiveValue hidden={sensitive && isPrivacyMode} className="text-gradient-charcoal">{display}</SensitiveValue>
          </div>
        </div>
        <div className={`size-10 rounded-xl flex items-center justify-center ${accent ? 'bg-gradient-gold text-[var(--gold-foreground)]' : 'bg-foreground/[0.04] text-foreground'}`}>
          <Icon className="size-5" />
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${up ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
          {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {up ? '+' : ''}{delta}%
        </div>
        <Sparkline data={spark} up={up} />
      </div>
    </motion.div>
  );
}

export function EventsStats({ kpis }: { kpis: Array<{
  label: string; value: number; prefix?: string; delta: number; trend: 'up' | 'down';
  spark: number[]; icon: React.ComponentType<{ className?: string }>; accent?: boolean; sensitive: boolean;
}> }) {
  return (
    <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {kpis.map((k, i) => (
        <KpiCard key={k.label} {...k} delay={i * 0.05} />
      ))}
    </div>
  );
}
