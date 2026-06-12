'use client';

import { useState, useEffect, useMemo } from 'react';
import { PartyPopper, Calendar as CalendarIcon, CheckCircle2, Wallet, Users } from 'lucide-react';
import type { Event } from '@/features/events/types';
import { useNotificationStore } from '@/stores/notification-store';
import { SPARK_DEFAULTS } from '@/features/events/constants';
import { formatCurrency } from '@/lib/utils';

const mad = (n: number) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n);

export function useCounter(target: number, duration = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

export function useEventsStats(events: Event[]) {
  const today = useMemo(() => new Date(), []);

  const totalEvents = events.length;
  const confirmedEvents = events.filter(e => e.status === 'CONFIRMED').length;
  const upcomingEvents = events.filter(e => new Date(e.startDate) > today).length;
  const thisMonthEvents = events.filter(e => {
    const d = new Date(e.startDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const totalBudget = events.reduce((sum, e) => sum + Number(e.budget || 0), 0);
  const avgBudget = totalEvents > 0 ? Math.round(totalBudget / totalEvents) : 0;
  const activeClients = new Set(events.filter(e => e.clientId && (e.status === 'CONFIRMED' || e.status === 'IN_PROGRESS')).map(e => e.clientId)).size;

  const confirmationRate = totalEvents > 0 ? Math.round((confirmedEvents / totalEvents) * 100) : 0;
  const prevMonthEvents = events.filter(e => {
    const d = new Date(e.startDate);
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d >= prev && d < new Date(now.getFullYear(), now.getMonth(), 1);
  }).length;
  const eventGrowth = prevMonthEvents > 0 ? Math.round(((thisMonthEvents - prevMonthEvents) / prevMonthEvents) * 100) : thisMonthEvents > 0 ? 100 : 0;

  const eventTrend: 'up' | 'down' = eventGrowth >= 0 ? 'up' : 'down';

  const KPIS = [
    { label: "Total événements", value: totalEvents, delta: eventGrowth, trend: eventTrend, spark: SPARK_DEFAULTS.CONFIRMED, icon: PartyPopper, accent: true, sensitive: false },
    { label: "À venir", value: upcomingEvents, delta: 0, trend: 'up' as 'up' | 'down', spark: SPARK_DEFAULTS.PLANNED, icon: CalendarIcon, sensitive: false },
    { label: "Confirmés", value: confirmedEvents, delta: confirmationRate, trend: 'up' as 'up' | 'down', spark: SPARK_DEFAULTS.CONFIRMED, icon: CheckCircle2, sensitive: true },
    { label: "Budget total", value: totalBudget, prefix: "MAD", delta: 0, trend: 'up' as 'up' | 'down', spark: SPARK_DEFAULTS.COMPLETED, icon: Wallet, sensitive: true },
    { label: "Clients actifs", value: activeClients, delta: 0, trend: 'up' as 'up' | 'down', spark: SPARK_DEFAULTS.CONFIRMED, icon: Users, sensitive: false },
  ];

  const todayEvents = events.filter(e => {
    const d = new Date(e.startDate);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  const upcomingSorted = [...events]
    .filter(e => new Date(e.startDate) > today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);

  const alerts = useMemo(() => {
    const result: Array<{ type: 'warn' | 'danger' | 'info'; title: string; text: string }> = [];
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const seen = new Set<string>();
    const add = (type: 'warn' | 'danger' | 'info', title: string, text: string) => {
      const key = `${title}:${text}`;
      if (seen.has(key)) return;
      seen.add(key);
      result.push({ type, title, text });
    };

    for (const e of events) {
      const d = new Date(e.startDate);
      if (d > today && d <= sevenDaysFromNow) {
        add('warn', '⚠ Événement imminent', `${e.name} — ${e.clientName || 'Client'} (J-${Math.ceil((d.getTime() - today.getTime()) / 86400000)})`);
      }
      if (e.paymentStatus === 'UNPAID' && e.status !== 'DRAFT' && e.status !== 'CANCELLED') {
        add('danger', '⚠ Paiement manquant', `${e.name} — ${e.clientName || 'Client'}`);
      }
      if (!e.clientId) {
        add('info', '⚠ Client manquant', e.name);
      }
      if (!e.budget || Number(e.budget) === 0) {
        add('info', '⚠ Budget manquant', e.name);
      }
      if (!e.guestCount || e.guestCount === 0) {
        add('info', '⚠ Invités manquants', e.name);
      }
      if (!e.hasLinkedCommande && e.status !== 'DRAFT' && e.status !== 'CANCELLED') {
        add('warn', '⚠ Commande manquante', e.name);
      }
    }
    const dateMap = new Map<string, string[]>();
    for (const e of events) {
      const key = new Date(e.startDate).toLocaleDateString('fr-FR');
      if (!dateMap.has(key)) dateMap.set(key, []);
      dateMap.get(key)!.push(e.name);
    }
    for (const [date, names] of dateMap) {
      if (names.length >= 2) {
        add('danger', '⚠ Double réservation', `${date} — ${names.length} événements`);
      }
    }
    return result.slice(0, 4);
  }, [events, today]);

  const setNotifications = useNotificationStore((s) => s.setNotifications);
  useEffect(() => { setNotifications(alerts); }, [alerts, setNotifications]);

  const STATS_EVENTS = [
    { label: "Budget moyen", value: avgBudget },
    { label: "Événements mensuels", value: thisMonthEvents },
  ];

  return {
    totalEvents, confirmedEvents, upcomingEvents, thisMonthEvents,
    totalBudget, avgBudget, activeClients,
    confirmationRate, prevMonthEvents, eventGrowth, eventTrend,
    KPIS, todayEvents, upcomingSorted, alerts, STATS_EVENTS,
    today, mad,
  };
}
