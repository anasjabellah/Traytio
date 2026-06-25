'use server';

import { prisma } from '@/lib/prisma';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';
import type { CommandeStatus } from '@prisma/client';

const EXCLUDED_STATUSES: CommandeStatus[] = ['CANCELLED'];
const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export async function getRevenueAnalytics(): Promise<{
  success: boolean;
  data?: {
    totalRevenue: number;
    growth: number;
    weekData: number[];
    weekLabels: string[];
    weekTotal: number;
    weekGrowth: number;
    monthData: number[];
    monthLabels: string[];
    monthTotal: number;
    monthGrowth: number;
    yearData: number[];
    yearLabels: string[];
    yearTotal: number;
    yearGrowth: number;
  };
  error?: string;
}> {
  try {
    const organizationId = await getOrganizationId();
    await assertCan('dashboard', 'view');

    const now = new Date();

    const commandes = await prisma.commande.findMany({
      where: { organizationId, status: { notIn: EXCLUDED_STATUSES } },
      select: { totalAmount: true, createdAt: true },
    });

    const dailyMap = new Map<string, number>();
    const monthlyMap = new Map<string, number>();
    for (const cmd of commandes) {
      const d = new Date(cmd.createdAt);
      const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const val = Number(cmd.totalAmount);
      dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + val);
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + val);
    }

    const fmtDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const fmtMonth = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    function buildDayPeriod(days: number, labelFn: (d: Date) => string) {
      const data: number[] = [];
      const labels: string[] = [];
      let current = 0;
      let previous = 0;
      for (let i = days * 2 - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = fmtDay(d);
        const val = dailyMap.get(key) || 0;
        if (i >= days) { previous += val; } else { current += val; }
        if (i < days) {
          data.push(Math.round(val));
          labels.push(labelFn(d));
        }
      }
      return { data, labels, current: Math.round(current), previous: Math.round(previous) };
    }

    function buildMonthPeriod(months: number) {
      const data: number[] = [];
      const labels: string[] = [];
      let current = 0;
      let previous = 0;
      for (let i = months * 2 - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = fmtMonth(d);
        const val = monthlyMap.get(key) || 0;
        if (i >= months) { previous += val; } else { current += val; }
        if (i < months) {
          data.push(Math.round(val));
          labels.push(MONTH_NAMES[d.getMonth()]);
        }
      }
      return { data, labels, current: Math.round(current), previous: Math.round(previous) };
    }

    function calcGrowth(current: number, previous: number): number {
      if (previous === 0 && current === 0) return 0;
      if (previous === 0) return 100;
      return Math.round(((current - previous) / previous) * 100);
    }

    const week = buildDayPeriod(7, (d) => d.toLocaleDateString('fr-FR', { weekday: 'short' }));
    const month = buildDayPeriod(30, (d) => String(d.getDate()));
    const year = buildMonthPeriod(12);

    const totalRevenue = Math.round(commandes.reduce((sum, c) => sum + Number(c.totalAmount), 0));
    const growth = calcGrowth(month.current, month.previous);

    return {
      success: true,
      data: {
        totalRevenue,
        growth,
        weekData: week.data,
        weekLabels: week.labels,
        weekTotal: week.current,
        weekGrowth: calcGrowth(week.current, week.previous),
        monthData: month.data,
        monthLabels: month.labels,
        monthTotal: month.current,
        monthGrowth: calcGrowth(month.current, month.previous),
        yearData: year.data,
        yearLabels: year.labels,
        yearTotal: year.current,
        yearGrowth: calcGrowth(year.current, year.previous),
      },
    };
  } catch (error: unknown) {
    console.error('[getRevenueAnalytics] ERROR:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' };
  }
}
