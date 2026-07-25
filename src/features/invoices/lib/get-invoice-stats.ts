import { prisma } from '@/lib/prisma';
import { getOrganizationId } from '@/lib/get-organization-id';
import { buildMonthKeys, buildMonthlySparkline } from '@/features/dashboard/lib/kpi-engine';

export type RecentInvoiceActivity = {
  id: string;
  number: string;
  type: string;
  status: string;
  updatedAt: Date;
};

export type PaymentStatusGroup = {
  label: string;
  count: number;
  total: number;
  priority: number;
};

export type InvoiceStats = {
  totalInvoiced: number;
  totalCollected: number;
  totalRemaining: number;
  documentCount: number;
  paymentRate: number;
  largestInvoice: number;
  perfTotal: number[];
  perfCollected: number[];
  perfRemaining: number[];
  perfCount: number[];
  pendingPaymentGroups: PaymentStatusGroup[];
  recentActivity: RecentInvoiceActivity[];
  lastPayment: { amount: number; date: Date } | null;
  quickStats: {
    averageAmount: number;
    paidCount: number;
    overdueCount: number;
    overdueTotal: number;
    draftCount: number;
  };
  insights: string[];
};

const OVERDUE = 'OVERDUE';
const PAID = 'PAID';
const REJECTED = 'REJECTED';
const DRAFT = 'DRAFT';
const ACTIVE_STATUSES: import('@prisma/client').InvoiceStatus[] = ['SENT', 'VIEWED', 'ACCEPTED', 'OVERDUE'];

export async function getInvoiceStats(): Promise<InvoiceStats | null> {
  const orgId = await getOrganizationId();
  if (!orgId) return null;

  const now = new Date();
  const eightMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 7, 1);

  const [aggregateResult, statusGroupResult, monthlyRows, recentActivity, pendingInvoices, lastPayment] =
    await Promise.all([
      prisma.invoice.aggregate({
        where: { organizationId: orgId },
        _sum: { totalAmount: true, paidAmount: true },
        _max: { totalAmount: true },
        _count: true,
      }),
      prisma.invoice.groupBy({
        by: ['status'],
        where: { organizationId: orgId },
        _sum: { totalAmount: true, paidAmount: true },
        _count: true,
      }),
      prisma.invoice.findMany({
        where: { organizationId: orgId, createdAt: { gte: eightMonthsAgo } },
        select: { createdAt: true, totalAmount: true, paidAmount: true },
      }),
      prisma.invoice.findMany({
        where: { organizationId: orgId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, number: true, type: true, status: true, updatedAt: true },
      }),
      prisma.invoice.findMany({
        where: { organizationId: orgId, status: { in: ACTIVE_STATUSES } },
        select: { status: true, totalAmount: true, paidAmount: true },
      }),
      prisma.payment.findFirst({
        where: { invoice: { organizationId: orgId } },
        orderBy: { createdAt: 'desc' },
        select: { amount: true, createdAt: true },
      }),
    ]);

  const totalInvoiced = Number(aggregateResult._sum.totalAmount ?? 0);
  const totalCollected = Number(aggregateResult._sum.paidAmount ?? 0);
  const totalRemaining = totalInvoiced - totalCollected;
  const documentCount = aggregateResult._count;
  const paymentRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;
  const largestInvoice = Number(aggregateResult._max.totalAmount ?? 0);

  const monthKeys = buildMonthKeys(8);
  const perfTotal = buildMonthlySparkline(monthlyRows, monthKeys, (r) => Number(r.totalAmount));
  const perfCollected = buildMonthlySparkline(monthlyRows, monthKeys, (r) => Number(r.paidAmount));
  const perfRemaining = buildMonthlySparkline(monthlyRows, monthKeys, (r) => Number(r.totalAmount) - Number(r.paidAmount));
  const perfCount = buildMonthlySparkline(monthlyRows, monthKeys);

  const statusMap = new Map(statusGroupResult.map((g) => [g.status, g]));

  const draftCount = statusMap.get(DRAFT)?._count ?? 0;
  const overdueCount = statusMap.get(OVERDUE)?._count ?? 0;
  const overdueTotal = Number(statusMap.get(OVERDUE)?._sum.totalAmount ?? 0);
  const paidCount = statusMap.get(PAID)?._count ?? 0;

  const nonDraftGroups = statusGroupResult.filter((g) => g.status !== DRAFT);
  const nonDraftTotal = nonDraftGroups.reduce((s, g) => s + Number(g._sum.totalAmount ?? 0), 0);
  const nonDraftCount = nonDraftGroups.reduce((s, g) => s + g._count, 0);
  const averageAmount = nonDraftCount > 0 ? Math.round(nonDraftTotal / nonDraftCount) : 0;

  // Payment-oriented grouping from individual pending invoices
  let awaitingCount = 0;
  let awaitingTotal = 0;
  let partialCount = 0;
  let partialTotal = 0;
  let overdueInvoiceCount = 0;
  let overdueInvoiceTotal = 0;

  for (const inv of pendingInvoices) {
    const total = Number(inv.totalAmount);
    const paid = Number(inv.paidAmount);

    if (inv.status === OVERDUE) {
      overdueInvoiceCount++;
      overdueInvoiceTotal += total;
    } else if (paid > 0 && paid < total) {
      partialCount++;
      partialTotal += total;
    } else if (paid === 0) {
      awaitingCount++;
      awaitingTotal += total;
    }
  }

  const pendingPaymentGroups: PaymentStatusGroup[] = [];
  if (overdueInvoiceCount > 0) {
    pendingPaymentGroups.push({ label: 'En retard', count: overdueInvoiceCount, total: overdueInvoiceTotal, priority: 1 });
  }
  if (partialCount > 0) {
    pendingPaymentGroups.push({ label: 'Partiellement payée', count: partialCount, total: partialTotal, priority: 2 });
  }
  if (awaitingCount > 0) {
    pendingPaymentGroups.push({ label: 'En attente', count: awaitingCount, total: awaitingTotal, priority: 3 });
  }

  const firstPending = pendingInvoices[0];
  const lastPaymentData = lastPayment
    ? { amount: Number(lastPayment.amount), date: lastPayment.createdAt }
    : null;

  // Deterministic business insights
  const insights: string[] = [];

  if (totalInvoiced > 0) {
    insights.push(`${paymentRate}% des montants ont été encaissés.`);
  } else {
    insights.push('Aucun document financier émis.');
  }

  if (overdueInvoiceCount > 0) {
    insights.push(`${overdueInvoiceCount} facture${overdueInvoiceCount > 1 ? 's' : ''} en retard pour ${overdueInvoiceTotal.toLocaleString('fr-FR')} MAD.`);
  } else if (documentCount > 0) {
    insights.push('Aucune facture en retard.');
  }

  if (largestInvoice > 0) {
    insights.push(`Plus gros document : ${largestInvoice.toLocaleString('fr-FR')} MAD.`);
  }

  if (documentCount > 0) {
    insights.push(`${documentCount} document${documentCount > 1 ? 's' : ''} financier${documentCount > 1 ? 's' : ''} au total.`);
  }

  return {
    totalInvoiced,
    totalCollected,
    totalRemaining,
    documentCount,
    paymentRate,
    largestInvoice,
    perfTotal,
    perfCollected,
    perfRemaining,
    perfCount,
    pendingPaymentGroups,
    recentActivity,
    lastPayment: lastPaymentData,
    quickStats: {
      averageAmount,
      paidCount,
      overdueCount,
      overdueTotal,
      draftCount,
    },
    insights,
  };
}
