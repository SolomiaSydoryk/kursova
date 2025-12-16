import api from './api';

export const hallService = {
  // Отримати всі зали
  getAll: async (filters = {}) => {
    const response = await api.get('/halls/', { params: filters });
    return response.data;
  },

  // Отримати зал за ID
  getById: async (id) => {
    const response = await api.get(`/halls/${id}/`);
    return response.data;
  },

  // Створити зал
  create: async (hallData) => {
    const response = await api.post('/halls/', hallData);
    return response.data;
  },

  // Оновити зал
  update: async (id, hallData) => {
    const response = await api.patch(`/halls/${id}/`, hallData);
    return response.data;
  },
};