export type ActivityType =
  | 'commande_created'
  | 'commande_updated'
  | 'commande_status'
  | 'payment_received'
  | 'client_created'
  | 'event_created'
  | 'invoice_created';

export type ActivityFeedItem = {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: Date;
  timeAgo: string;
  entityId: string | null;
  entityType: 'commande' | 'client' | 'event' | 'payment' | 'invoice' | null;
  entityLabel: string | null;
  metadata?: Record<string, unknown>;
};

export type ActivityPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ActivityFeedResponse = {
  items: ActivityFeedItem[];
  stats: {
    totalToday: number;
    totalWeek: number;
    totalMonth: number;
  };
  pagination: ActivityPagination;
};
