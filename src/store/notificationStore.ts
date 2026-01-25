import { create } from "zustand";

export interface Notification {
  id: string;
  user_id: string;
  user_name: string;
  user_image: string | null;
  action: string;
  description: string;
  timestamp: string;
  read: boolean;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  removeNotification: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    set({ notifications, unreadCount });
  },

  addNotification: (notification) => {
    set((state) => {
      const newNotif = { ...notification, read: false };
      const newNotifications = [newNotif, ...state.notifications];
      const unreadCount = newNotifications.filter((n) => !n.read).length;
      return {
        notifications: newNotifications,
        unreadCount,
      };
    });
  },

  markAsRead: (id) => {
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      const unreadCount = notifications.filter((n) => !n.read).length;
      return { notifications, unreadCount };
    });
  },

  removeNotification: (id) => {
    set((state) => {
      const notifications = state.notifications.filter((n) => n.id !== id);
      const unreadCount = notifications.filter((n) => !n.read).length;
      return { notifications, unreadCount };
    });
  },

  markAllAsRead: () => {
    set((state) => {
      const notifications = state.notifications.map((n) => ({ ...n, read: true }));
      return { notifications, unreadCount: 0 };
    });
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));
