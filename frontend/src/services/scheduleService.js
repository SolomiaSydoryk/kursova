import api from './api';

export const scheduleService = {
  // Отримати розклад секції
  getSectionSchedule: async (sectionId) => {
    const response = await api.get('/schedule/', { params: { section: sectionId } });
    return response.data;
  },

  // Додати timeslot до розкладу секції
  addTimeslot: async (sectionId, timeslotData) => {
    const response = await api.post('/timeslots/create/', {
      section_id: sectionId,
      ...timeslotData,
    });
    return response.data;
  },

  // Видалити timeslot з розкладу секції
  removeTimeslot: async (scheduleId) => {
    const response = await api.delete(`/schedule/${scheduleId}/`);
    return response.data;
  },
};

