import api from './api';

export const authService = {
  // Вхід через email
  login: async (email, password) => {
    try {
      console.log('Attempting login with email:', email);
      const response = await api.post('/auth/login/', {
        email,
        password,
      });
      
      console.log('Login response:', response.data);
      const { access, refresh, user } = response.data;
      
      if (!access || !refresh) {
        throw new Error('Не отримано токени від сервера');
      }
      
      // Зберігаємо токени
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      console.log('Tokens saved, user:', user);
      return { user, access, refresh };
    } catch (error) {
      console.error('Login error:', error);
      // Детальна обробка помилок
      if (error.response) {
        // Сервер відповів з помилкою
        const detail = error.response.data?.detail || error.response.data?.non_field_errors?.[0];
        throw new Error(detail || 'Невірний email або password');
      } else if (error.request) {
        // Запит був зроблений, але відповіді не отримано
        throw new Error('Не вдалося підключитися до сервера. Перевірте, чи запущений Django сервер.');
      } else {
        // Помилка при налаштуванні запиту
        throw new Error(error.message || 'Помилка при виконанні запиту');
      }
    }
  },

  // Вихід
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  // Перевірка чи користувач залогінений
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  // Реєстрація нового користувача
  register: async (email, first_name, last_name, password = null) => {
    try {
      console.log('Attempting registration with email:', email);
      const data = { email, first_name, last_name };
      if (password) {
        data.password = password;
      }
      
      const response = await api.post('/auth/register/', data);
      
      console.log('Registration response:', response.data);
      const { access, refresh, user } = response.data;
      
      if (!access || !refresh) {
        throw new Error('Не отримано токени від сервера');
      }
      
      // Зберігаємо токени
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      console.log('Registration successful, tokens saved, user:', user);
      return { user, access, refresh };
    } catch (error) {
      console.error('Registration error:', error);
      // Детальна обробка помилок
      if (error.response) {
        const detail = error.response.data?.detail || 
                      error.response.data?.email?.[0] ||
                      error.response.data?.first_name?.[0] ||
                      error.response.data?.last_name?.[0] ||
                      Object.values(error.response.data || {}).flat()[0];
        throw new Error(detail || 'Помилка реєстрації');
      } else if (error.request) {
        throw new Error('Не вдалося підключитися до сервера. Перевірте, чи запущений Django сервер.');
      } else {
        throw new Error(error.message || 'Помилка при виконанні запиту');
      }
    }
  },

  // Отримати поточного користувача
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('No access token found');
        return null;
      }
      
      console.log('Fetching user profile...');
      const response = await api.get('/auth/profile/');
      console.log('User profile response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting current user:', error);
      console.error('Error response:', error.response);
      // Якщо помилка 401 - токен невалідний
      if (error.response?.status === 401) {
        console.log('401 Unauthorized - logging out');
        authService.logout();
      }
      return null;
    }
  },

  // Оновити профіль користувача
  updateProfile: async (formData) => {
    try {
      const response = await api.put('/auth/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Для завантаження фото
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.response) {
        const detail = error.response.data?.detail || 
                      Object.values(error.response.data || {}).flat()[0];
        throw new Error(detail || 'Помилка оновлення профілю');
      }
      throw new Error(error.message || 'Помилка при оновленні профілю');
    }
  },
};