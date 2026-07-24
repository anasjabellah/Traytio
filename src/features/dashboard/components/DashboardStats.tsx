'use client';

import { memo } from 'react';
import { Wallet, Receipt, PartyPopper, Users, Clock, Banknote } from 'lucide-react';
import { KpiCard } from '@/shared/components/kpi-card';
import type { KpiCardProps } from '@/shared/components/kpi-card';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  wallet: Wallet,
  receipt: Receipt,
  party: PartyPopper,
  users: Users,
  clock: Clock,
  banknote: Banknote,
};

export type DashboardKpiItem = Omit<KpiCardProps, 'icon'> & { icon: string };

export const KpiGrid = memo(function KpiGrid({ kpis }: { kpis: DashboardKpiItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpis.map((k, i) => {
        const Icon = ICONS[k.icon];
        const cardProps: KpiCardProps = { ...k, icon: Icon };
        return <KpiCard key={k.label} {...cardProps} delay={i * 0.05} />;
      })}
    </div>
  );
});
