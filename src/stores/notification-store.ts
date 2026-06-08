import { create } from 'zustand';

export type AppNotification = {
  id: string;
  type: 'warn' | 'danger' | 'info';
  title: string;
  text: string;
  read: boolean;
  timestamp: number;
};

type NotificationStore = {
  notifications: AppNotification[];
  unreadCount: number;
  setNotifications: (items: Omit<AppNotification, 'read' | 'id' | 'timestamp'>[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
};

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (items) =>
    set(() => {
      const notifications = items.map((item, i) => ({
        ...item,
        id: `notif-${Date.now()}-${i}`,
        read: false,
        timestamp: Date.now(),
      }));
      return { notifications, unreadCount: notifications.length };
    }),
  markAsRead: (id) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      };
    }),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
}));
