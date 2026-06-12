'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Clock, CircleDot, CheckCircle2,
  TrendingUp, Users,
} from 'lucide-react';
import { usePrivacyMode, SensitiveValue } from '@/components/privacy-mode';
import { mad } from '@/features/dashboard/constants';
import type { DashboardData } from '@/features/dashboard/types';

export const TodayEventsWidget = memo(function TodayEventsWidget({ events }: { events: DashboardData['todayEvents'] }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Aujourd'hui</div>
          <h3 className="font-display text-xl mt-1">Programme du jour</h3>
        </div>
        <span className="text-xs text-muted-foreground">{events.length}</span>
      </div>
      {events.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground">
          Aucun &eacute;v&eacute;nement programm&eacute; aujourd'hui
        </div>
      ) : (
        <div className="space-y-1">
          {events.map((ev, i) => {
            const d = new Date(ev.startDate);
            const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            return (
              <motion.div key={ev.id}
                initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-foreground/[0.03] cursor-pointer"
                onClick={() => { window.location.href = `/dashboard/events/${ev.id}`; }}>
                <div className="text-xs tabular-nums text-muted-foreground w-12 pt-0.5">{time}</div>
                <div className="relative flex-1 pl-3 border-l-2 border-[var(--gold)]/40">
                  <div className="text-sm font-medium leading-tight">{ev.name}</div>
                  {ev.guestCount && <div className="text-[10px] text-muted-foreground mt-0.5">{ev.guestCount} pax</div>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export const AlertsWidget = memo(function AlertsWidget({ alerts }: { alerts: DashboardData['alerts'] }) {
  const { isPrivacyMode } = usePrivacyMode();
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Vigilance</div>
          <h3 className="font-display text-xl mt-1">Alertes</h3>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700">{alerts.length}</span>
      </div>
      <div className="space-y-2">
        {alerts.length === 0 && (
          <div className="py-6 text-center text-xs text-muted-foreground">
            Aucune alerte
          </div>
        )}
        {alerts.map((a, i) => {
          const Icon = a.type === "danger" ? AlertTriangle : a.type === "warn" ? Clock : AlertTriangle;
          const tone =
            a.type === "danger" ? "bg-rose-50/60 border-rose-200/60 text-rose-900" :
              a.type === "warn" ? "bg-amber-50/60 border-amber-200/60 text-amber-900" :
                "bg-blue-50/60 border-blue-200/60 text-blue-900";
          return (
            <motion.div key={i}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={`rounded-xl border p-3 flex items-start gap-3 ${tone}`}>
              <Icon className="size-4 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{a.title}</div>
                <div className="text-xs opacity-80 truncate">
                  {a.type === 'warn' ? <SensitiveValue hidden={isPrivacyMode}>{a.text}</SensitiveValue> : a.text}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});

export const ActivityFeedWidget = memo(function ActivityFeedWidget({ activity }: { activity: DashboardData['activity'] }) {
  const { isPrivacyMode } = usePrivacyMode();
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Temps r&eacute;el</div>
          <h3 className="font-display text-xl mt-1">Activit&eacute; r&eacute;cente</h3>
        </div>
      </div>
      <div className="relative space-y-3">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
        {activity.length === 0 && (
          <div className="py-6 text-center text-xs text-muted-foreground">Aucune activit&eacute; r&eacute;cente</div>
        )}
        {activity.map((f, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            className="relative pl-6">
            <CircleDot className="absolute left-0 top-1 size-3.5 text-[var(--gold-deep)] bg-card rounded-full" />
            <div className="text-xs leading-snug">
              <span className="font-medium">{f.who}</span>{" "}
              <span className="text-muted-foreground">{f.action}</span>{" "}
              {f.financial ? (
                <SensitiveValue hidden={isPrivacyMode} as="span" className="font-medium">{f.target}</SensitiveValue>
              ) : (
                <span className="font-medium">{f.target}</span>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{f.time}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

export const QuickStatsWidget = memo(function QuickStatsWidget({ stats }: { stats: DashboardData['quickStats'] }) {
  const { isPrivacyMode } = usePrivacyMode();
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft p-5">
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Indicateurs</div>
        <h3 className="font-display text-xl mt-1">Stats rapides</h3>
      </div>
      <div className="space-y-4">
        {[
          { label: "Budget moyen", value: mad(stats.avgBudget) },
          { label: "Invit\u00e9s moyen", value: stats.avgGuests > 0 ? `${stats.avgGuests} pax` : "0 pax" },
          { label: "Taux de r\u00e9alisation", value: `${stats.completionRate}%` },
        ].map((s, i) => {
          const isPercent = s.value.endsWith('%');
          const numVal = isPercent ? parseInt(s.value) : 50;
          return (
            <div key={s.label}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-medium tabular-nums"><SensitiveValue hidden={isPrivacyMode}>{s.value}</SensitiveValue></span>
              </div>
              {isPercent && (
                <div className="h-1.5 rounded-full bg-foreground/[0.05] overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${numVal}%` }}
                    transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                    className="h-full bg-gradient-gold" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-emerald-600" /> Donn&eacute;es mises &agrave; jour
        </div>
      </div>
    </div>
  );
});

export function DashboardSidebar({
  todayEvents, alerts, activity, quickStats,
}: {
  todayEvents: DashboardData['todayEvents'];
  alerts: DashboardData['alerts'];
  activity: DashboardData['activity'];
  quickStats: DashboardData['quickStats'];
}) {
  return (
    <aside className="col-span-12 xl:col-span-3 space-y-6">
      <div className="xl:sticky xl:top-24 space-y-6">
        <TodayEventsWidget events={todayEvents} />
        <AlertsWidget alerts={alerts} />
        <ActivityFeedWidget activity={activity} />
        <QuickStatsWidget stats={quickStats} />
      </div>
    </aside>
  );
}
