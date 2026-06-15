'use client';

import { KpiGrid, type KpiCardProps } from '@/shared/components/kpi-card';

export function ClientsStats({ kpis, isPrivacyMode }: {
  kpis: KpiCardProps[];
  isPrivacyMode: boolean;
}) {
  if (isPrivacyMode) return null;
  return <KpiGrid kpis={kpis} columns={5} />;
}
