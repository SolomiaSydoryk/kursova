import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  Grid,
  CircularProgress,
  Divider,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { authService } from '../../services/authService';
import { bookingService } from '../../services/bookingService';

const AdminProfilePage = () => {
  const navigate = useNavigate();
  const { user: contextUser } = useOutletContext() || {};
  const [user, setUser] = useState(contextUser);
  const [loading, setLoading] = useState(!contextUser);
  const [stats, setStats] = useState({
    pendingReservations: 0,
    totalReservations: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      loadUser();
    }
    loadStats();
  }, [user]);

  const loadUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (err) {
      console.error('Error loading user:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const reservations = await bookingService.getAllReservations();

      const pendingReservations = reservations.filter(
        res => res.hall && !res.section && res.reservation_status === 'pending'
      ).length;

      setStats({
        pendingReservations,
        totalReservations: reservations.length,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h6" color="error">
          Помилка завантаження профілю
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/admin/dashboard')}
        sx={{ mb: 3, color: '#FAF0E6' }}
      >
        Назад до панелі
      </Button>

      <Paper sx={{ p: 4, backgroundColor: '#FAF0E6' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <Avatar
            key={`admin-profile-${user?.photo || 'no-photo'}-${Date.now()}`}
            src={user?.photo || null}
            sx={{
              width: 120,
              height: 120,
              bgcolor: '#BB6830',
              color: '#FAF0E6',
              fontSize: '3rem',
              mb: 2,
            }}
          >
            {user?.first_name?.[0] || user?.username?.[0] || 'A'}
          </Avatar>
          <Chip
            label="Адміністратор"
            sx={{
              backgroundColor: '#153D33',
              color: '#FAF0E6',
              fontWeight: 500,
            }}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Email
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {user.email || 'Не вказано'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Телефон
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {user.phone || 'Не вказано'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Ім'я користувача
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {user.first_name && user.last_name 
                ? `${user.first_name} ${user.last_name}`
                : user.username || 'Не вказано'}
            </Typography>
          </Grid>

          {user.age && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Вік
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {user.age} років
              </Typography>
            </Grid>
          )}
        </Grid>

        <Divider sx={{ my: 3 }} />

        {statsLoading ? (
          <Box display="flex" justifyContent="center" sx={{ py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
              Бронювання
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Card sx={{ backgroundColor: '#FAF6E6', border: '1px solid #E8D4B8' }}>
                  <CardContent>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: '#BB6830' }}>
                      {stats.pendingReservations}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Очікує підтвердження
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card sx={{ backgroundColor: '#FAF6E6', border: '1px solid #E8D4B8' }}>
                  <CardContent>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: '#1F5A4D' }}>
                      {stats.totalReservations}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Всього бронювань
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default AdminProfilePage;