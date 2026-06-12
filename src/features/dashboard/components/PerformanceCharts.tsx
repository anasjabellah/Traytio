'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PERF_COLORS } from '@/features/dashboard/constants';

export const PerformanceCharts = memo(function PerformanceCharts({
  perfRevenue, perfEvents, perfClients,
}: {
  perfRevenue: number[];
  perfEvents: number[];
  perfClients: number[];
}) {
  const charts = useMemo(() => [
    { label: "Revenue", data: perfRevenue, color: PERF_COLORS[0] },
    { label: "\u00c9v\u00e9nements", data: perfEvents, color: PERF_COLORS[1] },
    { label: "Clients", data: perfClients, color: PERF_COLORS[2] },
    { label: "Paiements", data: perfRevenue, color: PERF_COLORS[3] },
  ], [perfRevenue, perfEvents, perfClients]);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Performance</div>
          <h3 className="font-display text-2xl mt-1">Vue d'ensemble &mdash; 8 derniers mois</h3>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {charts.map((c, ci) => {
          const max = Math.max(...c.data, 1);
          return (
            <motion.div key={c.label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.08 }}
              className="rounded-xl border border-border p-4 bg-[var(--surface-elevated)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">{c.label}</span>
                {c.data.length > 0 && (
                  <span className="text-xs font-medium text-emerald-700">
                    {c.data[c.data.length - 1] > c.data[0] ? '+' : ''}
                    {c.data.length > 1 ? Math.round(((c.data[c.data.length - 1] - c.data[0]) / Math.max(1, c.data[0])) * 100) : 0}%
                  </span>
                )}
              </div>
              <div className="flex items-end gap-1 h-20">
                {c.data.map((v, i) => (
                  <motion.div key={i}
                    initial={{ height: 0 }} animate={{ height: `${(v / max) * 100}%` }}
                    transition={{ delay: 0.3 + i * 0.04, duration: 0.5, ease: "easeOut" }}
                    className="flex-1 rounded-t-sm"
                    style={{ background: `linear-gradient(180deg, ${c.color}, ${c.color}55)` }} />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});
