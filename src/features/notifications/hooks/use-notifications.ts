'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/features/notifications/actions/notification-actions';
import type { NotificationItem } from '@/features/notifications/types';
import type { NotificationType } from '@prisma/client';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;
export const NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY = ['notifications', 'unread-count'] as const;

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  if (diffMs < 0) return "À l'instant";
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} jours`;
  return new Date(then).toLocaleDateString('fr-FR');
}

export const NOTIFICATION_ICON_BY_TYPE: Record<NotificationType, 'info' | 'success' | 'warn'> = {
  COMMANDE_CREATED: 'info',
  PAYMENT_RECEIVED: 'success',
  EVENT_CREATED: 'info',
  INVOICE_CREATED: 'info',
  TEAM_INVITATION: 'warn',
};

export function useNotifications() {
  const queryClient = useQueryClient();

  const listQuery = useQuery<NotificationItem[]>({
    queryKey: [...NOTIFICATIONS_QUERY_KEY],
    queryFn: async () => {
      const res = await getNotifications();
      if (!res.success) throw new Error(res.error ?? 'Fetch failed');
      return res.data ?? [];
    },
  });

  const countQuery = useQuery<number>({
    queryKey: [...NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY],
    queryFn: async () => {
      const res = await getUnreadNotificationCount();
      if (!res.success) throw new Error(res.error ?? 'Fetch failed');
      return res.data ?? 0;
    },
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_QUERY_KEY] });
    void queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY] });
  }, [queryClient]);

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await markNotificationAsRead(id);
      if (!res.success) throw new Error(res.error ?? 'Mark failed');
    },
    onSettled: invalidate,
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await markAllNotificationsAsRead();
      if (!res.success) throw new Error(res.error ?? 'Mark failed');
    },
    onSettled: invalidate,
  });

  return {
    notifications: listQuery.data ?? [],
    unreadCount: countQuery.data ?? 0,
    isLoading: listQuery.isLoading || countQuery.isLoading,
    isError: listQuery.isError || countQuery.isError,
    markAsRead: (id: string) => markReadMutation.mutate(id),
    markAllAsRead: () => markAllReadMutation.mutate(),
    isMarking: markReadMutation.isPending || markAllReadMutation.isPending,
  };
}
