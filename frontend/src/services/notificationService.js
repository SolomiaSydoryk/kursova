import api from './api';

export const notificationService = {
  // Отримати сповіщення користувача
  getNotifications: async () => {
    const response = await api.get('/notifications/');
    return response.data;
  },

  // Позначити сповіщення як прочитане
  markAsRead: async (notificationId) => {
    const response = await api.patch(`/notifications/${notificationId}/read/`);
    return response.data;
  },

  // Позначити всі сповіщення як прочитані
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/mark-all-read/');
    return response.data;
  },
};

