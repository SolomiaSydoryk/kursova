import api from './api';

export const sectionService = {
  // Отримати всі секції
  getAll: async (filters = {}) => {
    const response = await api.get('/sections/', { params: filters });
    return response.data;
  },

  // Отримати секцію за ID
  getById: async (id) => {
    const response = await api.get(`/sections/${id}/`);
    return response.data;
  },

  // Створити секцію
  create: async (sectionData) => {
    const response = await api.post('/sections/', sectionData);
    return response.data;
  },

  // Оновити секцію
  update: async (id, sectionData) => {
    const response = await api.patch(`/sections/${id}/`, sectionData);
    return response.data;
  },
};