'use client';

import { memo, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { usePrivacyMode, SensitiveValue } from '@/components/privacy-mode';
import { mad } from '@/features/dashboard/constants';

export const RevenueChart = memo(function RevenueChart({
  weekData, weekLabels, monthData, monthLabels, yearData, yearLabels, total, growth,
}: {
  weekData: number[]; weekLabels: string[];
  monthData: number[]; monthLabels: string[];
  yearData: number[]; yearLabels: string[];
  total: number; growth: number;
}) {
  const { isPrivacyMode } = usePrivacyMode();
  const [range, setRange] = useState<"Semaine" | "Mois" | "Ann\u00e9e">("Ann\u00e9e");
  const data = range === "Semaine" ? weekData : range === "Mois" ? monthData : yearData;
  const labels = range === "Semaine" ? weekLabels : range === "Mois" ? monthLabels : yearLabels;
  const [hover, setHover] = useState<number | null>(null);
  const [w, h, padX, padY] = [800, 260, 28, 24];

  const { pts, path, fill } = useMemo(() => {
    if (data.length < 2) {
      return { pts: [], path: '', fill: '' };
    }
    const mx = Math.max(...data, 1) * 1.15;
    const mn = 0;
    const p = data.map((d, i) => {
      const x = padX + (i * (w - padX * 2)) / (data.length - 1);
      const y = h - padY - ((d - mn) / (mx - mn)) * (h - padY * 2);
      return [x, y];
    });
    const pa = p.map((pt, i) => (i === 0 ? `M${pt[0]},${pt[1]}` : `L${pt[0]},${pt[1]}`)).join(" ");
    const fi = `${pa} L${p[p.length - 1][0]},${h - padY} L${p[0][0]},${h - padY} Z`;
    return { pts: p, path: pa, fill: fi };
  }, [data, w, h, padX, padY]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border bg-card shadow-soft p-6"
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">&Eacute;volution du chiffre d'affaires</div>
          <div className="mt-2 flex items-baseline gap-3">
            <div className="font-display text-4xl tabular-nums">
              <SensitiveValue hidden={isPrivacyMode} className="text-gradient-charcoal">{mad(total)}</SensitiveValue>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-md inline-flex items-center gap-1 ${growth >= 0 ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}`}>
              {growth >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              <SensitiveValue hidden={isPrivacyMode}>{growth >= 0 ? "+" : ""}{growth}%</SensitiveValue>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-foreground/[0.04] border border-border">
          {(["Semaine", "Mois", "Ann\u00e9e"] as const).map((r) => (
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
              <rect x={p[0] - (w / Math.max(1, data.length)) / 2} y={0} width={w / Math.max(1, data.length)} height={h} fill="transparent" />
              {hover === i && (
                <>
                  <line x1={p[0]} x2={p[0]} y1={padY} y2={h - padY} stroke="oklch(0.20 0.012 70 / 0.2)" strokeDasharray="3 3" />
                  <circle cx={p[0]} cy={p[1]} r={5} fill="white" stroke="oklch(0.65 0.13 78)" strokeWidth={2} />
                </>
              )}
            </g>
          ))}
        </svg>

        {hover !== null && data[hover] > 0 && (
          <div className="absolute -translate-x-1/2 -translate-y-full pointer-events-none"
            style={{ left: `${(pts[hover][0] / w) * 100}%`, top: `${(pts[hover][1] / h) * 100}%` }}>
            <div className="mb-3 px-3 py-2 rounded-lg bg-foreground text-background text-xs shadow-lift whitespace-nowrap">
              <div className="opacity-70">{labels[hover]}</div>
              <div className="font-medium tabular-nums"><SensitiveValue hidden={isPrivacyMode}>{mad(data[hover])}</SensitiveValue></div>
            </div>
          </div>
        )}

        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground px-7">
          {labels.filter((_, i) => i % Math.ceil(labels.length / 8) === 0).map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
});
