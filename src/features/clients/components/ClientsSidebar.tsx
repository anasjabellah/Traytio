'use client';

import { motion } from 'framer-motion';
import {
  UserPlus, Pencil, ShoppingCart, Calendar, CreditCard,
  Clock, CheckCircle2, TrendingUp,
} from 'lucide-react';
import type { ClientStats } from '@/features/clients/actions/get-client-stats';
import type { ActivityItem } from '@/features/clients/actions/get-client-activity';

const mad = (n: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n);

function ActivitySection({ activities }: { activities: ActivityItem[] }) {
  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'client_created': return UserPlus;
      case 'client_updated': return Pencil;
      case 'commande_created': return ShoppingCart;
      case 'event_assigned': return Calendar;
      case 'payment_received': return CreditCard;
    }
  };
  const getColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'client_created': return 'text-blue-600 bg-blue-50';
      case 'client_updated': return 'text-sky-600 bg-sky-50';
      case 'commande_created': return 'text-purple-600 bg-purple-50';
      case 'event_assigned': return 'text-amber-600 bg-amber-50';
      case 'payment_received': return 'text-emerald-600 bg-emerald-50';
    }
  };
  const formatTime = (date: Date) => {
    const now = new Date();
    const d = new Date(date);
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    return d.toLocaleDateString('fr-FR');
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Activit&eacute;</div>
          <h3 className="font-display text-xl mt-1">Fil d&apos;activit&eacute;</h3>
        </div>
        <span className="text-xs text-muted-foreground">{activities.length}</span>
      </div>
      {activities.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-10 flex flex-col items-center gap-3 text-center"
        >
          <div className="size-14 rounded-full bg-foreground/[0.03] flex items-center justify-center">
            <Clock className="size-7 text-muted-foreground/30" strokeWidth={1.2} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Aucune activit&eacute; r&eacute;cente</p>
            <p className="text-xs text-muted-foreground/50 mt-1 max-w-[200px]">
              Les interactions clients appara&icirc;tront ici au fur et &agrave; mesure.
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="relative">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border/60" />
          <div className="space-y-0">
            {activities.map((a, i) => {
              const Icon = getIcon(a.type);
              const color = getColor(a.type);
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative flex items-start gap-3 pb-4 last:pb-0"
                >
                  <div className={`relative z-10 size-8 rounded-lg ${color} flex items-center justify-center shrink-0`}>
                    <Icon className="size-3.5" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="text-xs leading-snug text-foreground/80">{a.description}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-muted-foreground/50">{a.clientName}</span>
                      <span className="size-0.5 rounded-full bg-muted-foreground/30" />
                      <span className="text-[10px] text-muted-foreground/40">{formatTime(a.createdAt)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickStatsSection({ stats, avgValue, activePct, topCity, growthRate }: {
  stats: ClientStats | null;
  avgValue: number;
  activePct: number;
  topCity: string;
  growthRate: number;
}) {
  const hasData = (stats?.totalClients ?? 0) > 0;
  const hasFinancialData = avgValue > 0;

  const quickStats = [
    { label: 'D&eacute;pense moyenne', value: hasFinancialData ? avgValue : 0, isMoney: true as const, show: hasFinancialData },
    { label: 'Clients actifs', value: hasData ? activePct : 0, suffix: '%' as const, show: hasData },
    { label: 'Ville principale', value: hasData && topCity && topCity !== '\u2014' ? topCity : '\u2014', isString: true as const, show: hasData },
    { label: 'Taux de croissance', value: hasData ? growthRate : 0, suffix: '%' as const, show: hasData },
  ];

  const visibleStats = quickStats.filter(s => s.show);
  const hasAnyData = visibleStats.length > 0;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Indicateurs</div>
        <h3 className="font-display text-xl mt-1">Stats rapides</h3>
      </div>
      {!hasAnyData ? (
        <div className="py-8 flex flex-col items-center gap-3 text-center">
          <div className="size-12 rounded-full bg-foreground/[0.03] flex items-center justify-center">
            <TrendingUp className="size-6 text-muted-foreground/30" strokeWidth={1.2} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Aucune statistique disponible</p>
            <p className="text-xs text-muted-foreground/50 mt-0.5 max-w-[180px]">
              Les indicateurs appara&icirc;tront avec les premi&egrave;res commandes.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {visibleStats.map((s, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-medium tabular-nums">
                    {'isMoney' in s && s.isMoney ? mad(Math.round(s.value as number)) :
                     'suffix' in s ? `${Math.round(s.value as number)}${s.suffix}` :
                     s.value}
                  </span>
                </div>
                {'isMoney' in s && s.isMoney && stats && (
                  <div className="h-1.5 rounded-full bg-foreground/[0.05] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((s.value as number) / Math.max(stats.totalRevenue || 1, 1) * 100, 100)}%` }}
                      transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                      className="h-full bg-gradient-gold"
                    />
                  </div>
                )}
                {'suffix' in s && s.suffix === '%' && (
                  <div className="h-1.5 rounded-full bg-foreground/[0.05] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(s.value as number, 100)}%` }}
                      transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                      className="h-full bg-gradient-gold"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              {stats ? `${stats.totalClients} client${stats.totalClients > 1 ? 's' : ''} au total` : 'Chargement...'}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function ClientsSidebar({
  activities, stats, avgValue, activePct, topCity, growthRate,
}: {
  activities: ActivityItem[];
  stats: ClientStats | null;
  avgValue: number;
  activePct: number;
  topCity: string;
  growthRate: number;
}) {
  return (
    <aside className="w-[320px] shrink-0 space-y-6">
      <div className="xl:sticky xl:top-24 space-y-6">
        <ActivitySection activities={activities} />
        <QuickStatsSection
          stats={stats}
          avgValue={avgValue}
          activePct={activePct}
          topCity={topCity}
          growthRate={growthRate}
        />
      </div>
    </aside>
  );
}
