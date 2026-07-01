'use client';

import { memo } from 'react';
import { KpiCard } from '@/shared/components/kpi-card';
import type { KpiCardProps } from '@/shared/components/kpi-card';

export const KpiGrid = memo(function KpiGrid({ kpis }: { kpis: KpiCardProps[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpis.map((k, i) => (
        <KpiCard key={k.label} {...k} delay={i * 0.05} />
      ))}
    </div>
  );
});
