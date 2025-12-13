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

  // Отримати доступні таймслоти для секції
  getAvailableTimeslots: async (sectionId) => {
    const response = await api.get('/available-timeslots/', {
      params: { section_id: sectionId },
    });
    return response.data;
  },
};