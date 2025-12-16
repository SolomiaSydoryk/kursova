import api from './api';

export const notificationService = {
  // Отримати сповіщення користувача
  getNotifications: async () => {
    const response = await api.get('/notifications/');
    return response.data;
  },
};

