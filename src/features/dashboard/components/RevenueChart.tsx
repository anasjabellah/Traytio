'use client';

import { memo, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { usePrivacyMode, SensitiveValue } from '@/components/privacy-mode';
import { mad } from '@/features/dashboard/constants';

function calcGrowth(current: number, previous: number): number {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

export const RevenueChart = memo(function RevenueChart({
  weekData, weekLabels, weekTotal, weekGrowth,
  revenueMaps,
}: {
  weekData: number[]; weekLabels: string[]; weekTotal: number; weekGrowth: number;
  revenueMaps: {
    daily: Record<string, number>;
    monthly: Record<string, number>;
    paidMonthly: Record<string, number>;
  };
}) {
  const { isPrivacyMode } = usePrivacyMode();
  const [range, setRange] = useState<"Semaine" | "Mois" | "Année">("Semaine");
  const [hover, setHover] = useState<number | null>(null);
  const [w, h, padX, padY] = [800, 260, 28, 24];

  const monthAnalytics = useMemo(() => {
    if (range !== "Mois") return null;
    const data: number[] = [];
    const labels: string[] = [];
    let current = 0;
    let previous = 0;
    const now = new Date();
    for (let i = 59; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const val = revenueMaps.daily[key] || 0;
      if (i >= 30) previous += val;
      else current += val;
      if (i < 30) {
        data.push(Math.round(val));
        labels.push(String(d.getDate()));
      }
    }
    return { data, labels, total: Math.round(current), growth: calcGrowth(current, previous) };
  }, [range, revenueMaps]);

  const yearAnalytics = useMemo(() => {
    if (range !== "Année") return null;
    const data: number[] = [];
    const labels: string[] = [];
    let current = 0;
    let previous = 0;
    const now = new Date();
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const val = revenueMaps.monthly[key] || 0;
      if (i >= 12) previous += val;
      else current += val;
      if (i < 12) {
        data.push(Math.round(val));
        labels.push(monthNames[d.getMonth()]);
      }
    }
    return { data, labels, total: Math.round(current), growth: calcGrowth(current, previous) };
  }, [range, revenueMaps]);

  const selected = useMemo(() => {
    const data = range === "Semaine" ? weekData : range === "Mois" ? (monthAnalytics?.data ?? []) : (yearAnalytics?.data ?? []);
    const labels = range === "Semaine" ? weekLabels : range === "Mois" ? (monthAnalytics?.labels ?? []) : (yearAnalytics?.labels ?? []);
    const total = range === "Semaine" ? weekTotal : range === "Mois" ? (monthAnalytics?.total ?? 0) : (yearAnalytics?.total ?? 0);
    const growth = range === "Semaine" ? weekGrowth : range === "Mois" ? (monthAnalytics?.growth ?? 0) : (yearAnalytics?.growth ?? 0);
    return { data, labels, total, growth };
  }, [range, weekData, weekLabels, weekTotal, weekGrowth, monthAnalytics, yearAnalytics]);

  const s = selected;

  const { pts, path, fill } = useMemo(() => {
    const d = selected.data;
    if (d.length < 2) {
      return { pts: [], path: '', fill: '' };
    }
    const mx = Math.max(...d, 1) * 1.15;
    const mn = 0;
    const p = d.map((v, i) => {
      const x = padX + (i * (w - padX * 2)) / (d.length - 1);
      const y = h - padY - ((v - mn) / (mx - mn)) * (h - padY * 2);
      return [x, y];
    });
    const pa = p.map((pt, i) => (i === 0 ? `M${pt[0]},${pt[1]}` : `L${pt[0]},${pt[1]}`)).join(" ");
    const fi = `${pa} L${p[p.length - 1][0]},${h - padY} L${p[0][0]},${h - padY} Z`;
    return { pts: p, path: pa, fill: fi };
  }, [selected.data, w, h, padX, padY]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border bg-card shadow-soft p-6"
    >
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Évolution du chiffre d&rsquo;affaires</div>
          <div className="mt-2 flex items-baseline gap-3">
            <div className="font-display text-4xl tabular-nums">
              <SensitiveValue hidden={isPrivacyMode} className="text-gradient-charcoal">{mad(s.total)}</SensitiveValue>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-md inline-flex items-center gap-1 ${s.growth >= 0 ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}`}>
              {s.growth >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              <SensitiveValue hidden={isPrivacyMode}>{s.growth >= 0 ? "+" : ""}{s.growth}%</SensitiveValue>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-foreground/[0.04] border border-border">
          {(["Semaine", "Mois", "Année"] as const).map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 h-8 text-xs rounded-md transition-colors ${range === r ? "bg-background shadow-soft text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="relative" onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[260px]">
          <defs>
            <linearGradient id="rev-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.72 0.13 78)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="oklch(0.72 0.13 78)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="rev-stroke" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="oklch(0.40 0.012 70)" />
              <stop offset="100%" stopColor="oklch(0.65 0.13 78)" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <line key={t} x1={padX} x2={w - padX} y1={padY + t * (h - padY * 2)} y2={padY + t * (h - padY * 2)}
              stroke="oklch(0.20 0.012 70 / 0.06)" strokeDasharray="2 4" />
          ))}
          {path && (
            <>
              <motion.path d={fill} fill="url(#rev-fill)"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
              <motion.path d={path} fill="none" stroke="url(#rev-stroke)" strokeWidth={2.5}
                strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: "easeOut" }} />
            </>
          )}

          {pts.map((p, i) => (
            <g key={i} onMouseEnter={() => setHover(i)}>
              <rect x={p[0] - (w / Math.max(1, s.data.length)) / 2} y={0} width={w / Math.max(1, s.data.length)} height={h} fill="transparent" />
              {hover === i && (
                <>
                  <line x1={p[0]} x2={p[0]} y1={padY} y2={h - padY} stroke="oklch(0.20 0.012 70 / 0.2)" strokeDasharray="3 3" />
                  <circle cx={p[0]} cy={p[1]} r={5} fill="white" stroke="oklch(0.65 0.13 78)" strokeWidth={2} />
                </>
              )}
            </g>
          ))}
        </svg>

        {hover !== null && s.data[hover] > 0 && (
          <div className="absolute -translate-x-1/2 -translate-y-full pointer-events-none"
            style={{ left: `${(pts[hover][0] / w) * 100}%`, top: `${(pts[hover][1] / h) * 100}%` }}>
            <div className="mb-3 px-3 py-2 rounded-lg bg-foreground text-background text-xs shadow-lift whitespace-nowrap">
              <div className="opacity-70">{s.labels[hover]}</div>
              <div className="font-medium tabular-nums"><SensitiveValue hidden={isPrivacyMode}>{mad(s.data[hover])}</SensitiveValue></div>
            </div>
          </div>
        )}

        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground px-7">
          {s.labels.filter((_, i) => i % Math.ceil(s.labels.length / 8) === 0).map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
});
