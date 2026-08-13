import { defineStore } from 'pinia';
import { NotificationType } from '@/enum/notification/notificationType';

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  duration?: number; // ms
}

let notificationId = 0;

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [] as Notification[],
  }),
  actions: {
    showNotification(notification: Omit<Notification, 'id'>) {
      const id = ++notificationId;
      this.notifications.push({ ...notification, id });
      if (notification.duration !== 0) {
        setTimeout(() => this.removeNotification(id), notification.duration || 4000);
      }
    },
    removeNotification(id: string | number) {
      const numericId = typeof id === 'string' ? Number(id) : id;
      this.notifications = this.notifications.filter((n) => n.id !== numericId);
    },
    clearAll() {
      this.notifications = [];
    },
  },
});
