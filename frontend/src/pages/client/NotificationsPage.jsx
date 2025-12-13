import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import { ArrowBack, Notifications as NotificationsIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';
import { colors } from '../../theme/colors';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <ArrowBack 
            sx={{ cursor: 'pointer', mr: 2 }} 
            onClick={() => navigate('/client/profile')}
          />
          <Typography variant="h4">
            Сповіщення
          </Typography>
        </Box>

        {notifications.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            Немає сповіщень
          </Typography>
        ) : (
          <Box>
            {notifications.map((notification) => {
              // Визначаємо стилі залежно від типу сповіщення
              const getNotificationStyles = (type) => {
                if (type === 'bonus') {
                  // Для бонусів: темно-зелений border
                  return {
                    backgroundColor: 'transparent',
                    borderLeft: `6px solid ${colors.emeraldGreen}`,
                  };
                } else if (type === 'reminder') {
                  // Для нагадувань: помаранчевий border
                  return {
                    backgroundColor: 'transparent', 
                    borderLeft: `6px solid ${colors.egyptianEarth}`, 
                  };
                } else {
                  // Для інших типів (promo)
                  return {
                    backgroundColor: 'transparent', 
                    borderLeft: `6px solid ${colors.noirDeVigne}`,
                  };
                }
              };

              return (
                <Card 
                  key={notification.id} 
                  sx={{ 
                    mb: 2,
                    ...getNotificationStyles(notification.notification_type),
                  }}
                >
                  <CardContent>
                    <Typography variant="body1" sx={{ mb: 1, fontWeight: 600 }}>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDateTime(notification.date_time)}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default NotificationsPage;

