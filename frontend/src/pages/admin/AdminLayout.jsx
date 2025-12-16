import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import Header from '../../components/common/Header';
import { authService } from '../../services/authService';

const AdminLayout = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
    const handleFocus = () => {
      loadUser();
    };
    window.addEventListener('focus', handleFocus);
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
        authService.logout();
        navigate('/login');
        return;
      }
      if (!userData.is_staff) {
        // Якщо користувач не адміністратор - перенаправляємо на клієнтську частину
        navigate('/client/catalog');
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

export default AdminLayout;

