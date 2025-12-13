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

  // Отримати доступні таймслоти для залу
  getAvailableTimeslots: async (hallId) => {
    const response = await api.get('/available-timeslots/', {
      params: { hall_id: hallId },
    });
    return response.data;
  },
};