import type { EventStatus, EventType } from '@prisma/client';

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
  budget?: number | null; // from Decimal
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
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