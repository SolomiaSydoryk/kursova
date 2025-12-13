import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import Header from '../../components/common/Header';
import { authService } from '../../services/authService';

const ClientLayout = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
    // Оновлюємо користувача при поверненні на сторінку
    const handleFocus = () => {
      loadUser();
    };
    window.addEventListener('focus', handleFocus);
    // Оновлюємо користувача при зміні URL (наприклад, після редагування профілю)
    const handleLocationChange = () => {
      loadUser();
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('popstate', handleLocationChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      if (!userData) {
        // Якщо не вдалося завантажити користувача - перенаправляємо на login
        authService.logout();
        navigate('/login');
        return;
      }
      setUser(userData);
    } catch (err) {
      console.error('Error loading user:', err);
      authService.logout();
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #111A19 0%, #111A19 35%, #BB6830 65%, #BB6830 100%)',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #111A19 0%, #111A19 35%, #BB6830 65%, #BB6830 100%)',
      }}
    >
      <Header user={user} />
      <Outlet context={{ user, setUser }} />
    </Box>
  );
};

export default ClientLayout;

