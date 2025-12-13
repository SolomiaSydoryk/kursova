import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import theme from './theme/theme';
import LoginRegisterPage from './pages/LoginRegisterPage';
import { authService } from './services/authService';

// Layouts
import ClientLayout from './pages/client/ClientLayout';

// Client Pages
import CatalogPage from './pages/client/CatalogPage';
import SectionDetailPage from './pages/client/SectionDetailPage';
import HallDetailPage from './pages/client/HallDetailPage';
import ProfilePage from './pages/client/ProfilePage';
import EditProfilePage from './pages/client/EditProfilePage';
import BookingConfirmPage from './pages/client/BookingConfirmPage';
import BookingsHistoryPage from './pages/client/BookingsHistoryPage';
import NotificationsPage from './pages/client/NotificationsPage';
import SubscriptionsPage from './pages/client/SubscriptionsPage';

// Protected Route компонент
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    const auth = authService.isAuthenticated();
    
    if (!auth) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }
    
    try {
      const userData = await authService.getCurrentUser();
      
      if (!userData) {
        // Токен невалідний або користувач не знайдений
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      setUser(userData);
      setIsAuthenticated(true);
      
      if (requireAdmin && !userData.is_staff) {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setIsAuthenticated(false);
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
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !user?.is_staff) {
    return <Navigate to="/client/catalog" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginRegisterPage />} />
          
          {/* Клієнтські маршрути */}
          <Route
            path="/client"
            element={
              <ProtectedRoute>
                <ClientLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/client/catalog" replace />} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="sections/:id" element={<SectionDetailPage />} />
            <Route path="halls/:id" element={<HallDetailPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/edit" element={<EditProfilePage />} />
            <Route path="booking/confirm" element={<BookingConfirmPage />} />
            <Route path="bookings" element={<BookingsHistoryPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
          </Route>
          
          {/* Адмін маршрути */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requireAdmin>
                <div>Admin Area (буде додано)</div>
              </ProtectedRoute>
            }
          />
          
          {/* Перенаправлення на login за замовчуванням */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;