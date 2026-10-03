import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { api } from '@/services/api';
import type { NotificationItem } from '@/types/notification.types';

export const notificationService = {
  async getNotifications(userId: string): Promise<NotificationItem[]> {
    const { data } = await api.get(API_ENDPOINTS.NOTIFICATION.GET(userId));
    return data.data;
  },

  async createNotification(payload: {
    userId: string;
    title: string;
    message: string;
    type?: 'admin_verification' | 'interest_request' | 'system';
  }): Promise<NotificationItem> {
    const { data } = await api.post(API_ENDPOINTS.NOTIFICATION.CREATE, payload);
    return data.data;
  },

  async markAsRead(id: string): Promise<NotificationItem> {
    const { data } = await api.patch(API_ENDPOINTS.NOTIFICATION.MARK_READ(id));
    return data.data;
  },

  async markAllAsRead(userId: string): Promise<void> {
    await api.patch(API_ENDPOINTS.NOTIFICATION.MARK_ALL_READ(userId));
  },
};
