import api from './api';

export const subscriptionService = {
  getSubscriptions: async () => {
    const response = await api.get('/subscriptions/');
    return response.data;
  },

  purchaseSubscription: async (subscriptionId) => {
    const response = await api.post(`/subscriptions/${subscriptionId}/purchase/`);
    return response.data;
  },

  getMySubscriptions: async () => {
    const response = await api.get('/subscriptions/my/');
    return response.data;
  },
};

