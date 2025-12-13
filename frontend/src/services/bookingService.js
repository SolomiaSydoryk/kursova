import api from './api';

export const bookingService = {
  // Створити бронювання
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings/create/', bookingData);
    return response.data;
  },

  // Отримати мої бронювання
  getMyBookings: async () => {
    const response = await api.get('/bookings/my/');
    return response.data;
  },

  // Отримати бронювання за ID
  getById: async (id) => {
    const response = await api.get(`/reservations/${id}/`);
    return response.data;
  },

  // Скасувати бронювання
  cancelBooking: async (id) => {
    const response = await api.patch(`/reservations/${id}/`, {
      reservation_status: 'cancelled',
    });
    return response.data;
  },

  // Отримати доступні timeslots для секції або залу
  getAvailableTimeslots: async (sectionId = null, hallId = null) => {
    const params = {};
    if (sectionId) {
      params.section_id = sectionId;
    }
    if (hallId) {
      params.hall_id = hallId;
    }
    const response = await api.get('/available-timeslots/', { params });
    return response.data;
  },
};

