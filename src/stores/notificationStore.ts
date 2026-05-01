import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

interface NotificationStore {
  notifications: Notification[];
  isPanelOpen: boolean;
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  togglePanel: () => void;
  setPanelOpen: (isOpen: boolean) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      isPanelOpen: false,
      unreadCount: 0,
      
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: Math.random().toString(36).substring(7),
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        
        set((state) => {
          const newNotifications = [newNotification, ...state.notifications].slice(0, 50); // Keep last 50
          return {
            notifications: newNotifications,
            unreadCount: newNotifications.filter(n => !n.isRead).length
          };
        });
      },
      
      markAsRead: (id) => {
        set((state) => {
          const newNotifications = state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          );
          return {
            notifications: newNotifications,
            unreadCount: newNotifications.filter(n => !n.isRead).length
          };
        });
      },
      
      markAllAsRead: () => {
        set((state) => {
          const newNotifications = state.notifications.map((n) => ({ ...n, isRead: true }));
          return {
            notifications: newNotifications,
            unreadCount: 0
          };
        });
      },
      
      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },
      
      togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
      
      setPanelOpen: (isOpen) => set({ isPanelOpen: isOpen }),
    }),
    {
      name: 'helpdesk-notification-storage',
    }
  )
);
