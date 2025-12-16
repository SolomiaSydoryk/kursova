import api from './api';

export const trainerService = {
  // Отримати всіх тренерів
  getAll: async () => {
    const response = await api.get('/trainers/');
    return response.data;
  },
};

