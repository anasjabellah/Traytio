import type { EventStatus, EventType } from '@prisma/client';

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

export type Event = {
  id: string;
  organizationId: string;
  clientId?: string | null;
  name: string;
  type: EventType;
  status: EventStatus;
  startDate: Date;
  endDate?: Date | null;
  location?: string | null;
  guestCount?: number | null;
  budget?: number | null;
  contactPerson?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  clientName?: string | null;
  clientPhone?: string | null;
  paymentStatus?: PaymentStatus;
  healthScore?: number;
  daysUntil?: number;
  hasLinkedCommande?: boolean;
  totalPaid?: number;
  totalRemaining?: number;
};

export type CreateEventInput = {
  name: string;
  type: EventType;
  status?: EventStatus;
  startDate: Date;
  endDate?: Date;
  location?: string;
  guestCount?: number;
  budget?: number;
  contactPerson?: string;
  contactPhone?: string;
  notes?: string;
  clientId?: string;
};

export type UpdateEventInput = Partial<CreateEventInput> & { id: string };

export type GetEventsParams = {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'budget' | 'startDate';
  sortOrder?: 'asc' | 'desc';
  status?: EventStatus;
  type?: EventType;
  paymentStatus?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
  budgetMin?: number;
  budgetMax?: number;
  healthMin?: number;
  healthMax?: number;
};

export type PaginatedEvents = {
  data: Event[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type EventDetail = Event & {
  client?: { id: string; name: string; email?: string | null; phone?: string | null } | null;
  commandes?: Array<{
    id: string;
    number: string;
    status: string;
    totalAmount: string | number;
    createdAt: Date;
  }>;
};

export type ActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export function computeHealthScore(event: {
  clientId?: string | null;
  startDate?: Date | null;
  budget?: number | null;
  guestCount?: number | null;
  commandesCount?: number;
}): number {
  let score = 0;
  if (event.clientId) score += 20;
  if (event.startDate) score += 20;
  if (event.budget && event.budget > 0) score += 20;
  if (event.guestCount && event.guestCount > 0) score += 20;
  if (event.commandesCount && event.commandesCount > 0) score += 20;
  return score;
}

export function computePaymentStatus(commandes?: Array<{
  status: string;
  totalAmount: number | string;
  paidAmount?: number | string;
  remainingAmount?: number | string;
}>): PaymentStatus {
  if (!commandes || commandes.length === 0) return 'UNPAID';
  let totalPaid = 0;
  let totalDue = 0;
  for (const c of commandes) {
    const paid = Number(c.paidAmount ?? 0);
    const remaining = Number(c.remainingAmount ?? 0);
    totalPaid += paid;
    totalDue += paid + remaining;
  }
  if (totalDue === 0) return 'UNPAID';
  if (totalPaid >= totalDue) return 'PAID';
  if (totalPaid > 0) return 'PARTIAL';
  return 'UNPAID';
}

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-200 text-gray-800',
  PLANNED: 'bg-blue-200 text-blue-800',
  CONFIRMED: 'bg-green-200 text-green-800',
  IN_PROGRESS: 'bg-orange-200 text-orange-800',
  COMPLETED: 'bg-green-800 text-white',
  CANCELLED: 'bg-red-200 text-red-800',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-green-100 text-green-800 border-green-300',
  PARTIAL: 'bg-orange-100 text-orange-800 border-orange-300',
  UNPAID: 'bg-red-100 text-red-800 border-red-300',
};

export const HEALTH_LABELS: Record<number, { label: string; color: string; icon: string }> = {
  100: { label: 'Ready', color: 'text-green-600', icon: '🟢' },
  80: { label: 'Ready', color: 'text-green-600', icon: '🟢' },
  60: { label: 'Attention', color: 'text-amber-600', icon: '🟡' },
  40: { label: 'Critical', color: 'text-red-600', icon: '🔴' },
  20: { label: 'Critical', color: 'text-red-600', icon: '🔴' },
  0: { label: 'Critical', color: 'text-red-600', icon: '🔴' },
};

export function getHealthInfo(score: number): { label: string; color: string; icon: string } {
  if (score >= 80) return HEALTH_LABELS[100];
  if (score >= 50) return HEALTH_LABELS[60];
  return HEALTH_LABELS[20];
}

export function getHealthBadge(score: number): { badge: string; label: string } {
  if (score >= 80) return { badge: 'bg-green-100 text-green-800 border-green-300', label: 'Ready' };
  if (score >= 50) return { badge: 'bg-amber-100 text-amber-800 border-amber-300', label: 'Attention' };
  return { badge: 'bg-red-100 text-red-800 border-red-300', label: 'Critical' };
}

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon', PLANNED: 'Planifié', CONFIRMED: 'Confirmé',
  IN_PROGRESS: 'En cours', COMPLETED: 'Terminé', CANCELLED: 'Annulé',
};