'use client';

import { KpiGrid, type KpiCardProps } from '@/shared/components/kpi-card';

export function EventsStats({ kpis }: { kpis: KpiCardProps[] }) {
  return <KpiGrid kpis={kpis} columns={5} />;
}
