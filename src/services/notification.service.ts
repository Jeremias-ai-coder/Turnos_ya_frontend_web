import api from './api';

export interface AppNotification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  total: number;
  unreadCount: number;
}

export const getNotifications = async (limit: number = 30): Promise<NotificationsResponse> => {
  const response = await api.get<NotificationsResponse>('/notifications', { params: { limit } });
  return response.data;
};

export const markNotificationAsRead = async (id: number): Promise<AppNotification> => {
  const response = await api.patch<AppNotification>(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async (): Promise<{ count: number }> => {
  const response = await api.patch<{ count: number }>('/notifications/read-all');
  return response.data;
};
