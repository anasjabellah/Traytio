'use server';

import { prisma } from '@/lib/prisma';
import { getOrganizationId } from '@/lib/get-organization-id';
import { assertCan } from '@/lib/assert-role';

export type ReportRow = {
  number: string;
  status: string;
  clientName: string;
  eventName: string | null;
  eventDate: string | null;
  eventType: string | null;
  guestCount: number | null;
  totalAmount: number;
  acompteAmount: number;
  paidAmount: number;
  remainingAmount: number;
  transportFees: number;
  deliveryFees: number;
  equipmentFees: number;
  discountAmount: number;
  createdAt: string;
};

export type ReportSummary = {
  totalCommandes: number;
  totalRevenue: number;
  totalPaid: number;
  totalRemaining: number;
  averageOrder: number;
  statusBreakdown: Record<string, number>;
};

export type ReportFilters = {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  clientId?: string;
  eventType?: string;
};

export type ReportData = {
  rows: ReportRow[];
  summary: ReportSummary;
  generatedAt: string;
};

export async function generateReportData(filters: ReportFilters): Promise<{
  success: boolean;
  data?: ReportData;
  error?: string;
}> {
  try {
    const organizationId = await getOrganizationId();
    await assertCan('dashboard', 'view');

    const where: Record<string, unknown> = { organizationId };

    if (filters.dateFrom || filters.dateTo) {
      const createdAtFilter: Record<string, Date> = {};
      if (filters.dateFrom) createdAtFilter.gte = new Date(filters.dateFrom);
      if (filters.dateTo) {
        const end = new Date(filters.dateTo);
        end.setHours(23, 59, 59, 999);
        createdAtFilter.lte = end;
      }
      where.createdAt = createdAtFilter;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.eventType) {
      where.eventType = filters.eventType;
    }

    const commandes = await prisma.commande.findMany({
      where,
      select: {
        number: true,
        status: true,
        eventType: true,
        eventDate: true,
        guestCount: true,
        totalAmount: true,
        acompteAmount: true,
        paidAmount: true,
        remainingAmount: true,
        transportFees: true,
        deliveryFees: true,
        equipmentFees: true,
        discountAmount: true,
        createdAt: true,
        client: { select: { name: true } },
        event: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows: ReportRow[] = commandes.map((c) => ({
      number: c.number,
      status: c.status,
      clientName: c.client?.name ?? '—',
      eventName: c.event?.name ?? null,
      eventDate: c.eventDate?.toISOString() ?? null,
      eventType: c.eventType,
      guestCount: c.guestCount,
      totalAmount: Number(c.totalAmount),
      acompteAmount: Number(c.acompteAmount),
      paidAmount: Number(c.paidAmount),
      remainingAmount: Number(c.remainingAmount),
      transportFees: Number(c.transportFees ?? 0),
      deliveryFees: Number(c.deliveryFees ?? 0),
      equipmentFees: Number(c.equipmentFees ?? 0),
      discountAmount: Number(c.discountAmount ?? 0),
      createdAt: c.createdAt.toISOString(),
    }));

    const totalRevenue = rows.reduce((s, r) => s + r.totalAmount, 0);
    const totalPaid = rows.reduce((s, r) => s + r.paidAmount, 0);
    const totalRemaining = rows.reduce((s, r) => s + r.remainingAmount, 0);
    const statusBreakdown: Record<string, number> = {};
    for (const r of rows) {
      statusBreakdown[r.status] = (statusBreakdown[r.status] ?? 0) + 1;
    }

    const summary: ReportSummary = {
      totalCommandes: rows.length,
      totalRevenue,
      totalPaid,
      totalRemaining,
      averageOrder: rows.length > 0 ? Math.round(totalRevenue / rows.length) : 0,
      statusBreakdown,
    };

    return {
      success: true,
      data: {
        rows,
        summary,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}
