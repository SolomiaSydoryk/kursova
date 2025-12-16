import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Avatar,
  Button,
  Divider,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import { Edit, History, CardGiftcard, Notifications, CardMembership } from '@mui/icons-material';
import { authService } from '../../services/authService';
import { subscriptionService } from '../../services/subscriptionService';
import { useNavigate, useLocation } from 'react-router-dom';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadData();
  }, []);

  // Оновлюємо дані при поверненні зі сторінки редагування
  useEffect(() => {
    const handleFocus = () => {
      loadData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);
  
  // Оновлюємо дані при зміні location (коли повертаємось з редагування або покупки абонемента)
  useEffect(() => {
    if (location.pathname === '/client/profile') {
      loadData();
    }
  }, [location.pathname]);
  
  // Оновлюємо дані при поверненні зі сторінки покупки абонементів
  useEffect(() => {
    const handleFocus = () => {
      if (location.pathname === '/client/profile') {
        loadData();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [location.pathname]);

  const loadData = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      
      // Завантажуємо активні абонементи користувача
      try {
        const subscriptions = await subscriptionService.getMySubscriptions();
        // Фільтруємо тільки дійсні абонементи
        // Показуємо всі активні абонементи, які ще не використані (для разових) або не минув термін (для місячних)
        const validSubscriptions = subscriptions.filter(sub => {
          if (!sub.is_active) return false;
          
          // Для разового - показуємо якщо не використаний
          if (sub.subscription && sub.subscription.type === 'single') {
            return !sub.is_used;
          }
          
          // Для місячного - показуємо якщо не минув термін
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const endDate = new Date(sub.end_date);
          endDate.setHours(0, 0, 0, 0);
          
          return endDate >= today;
        });
        setUserSubscriptions(validSubscriptions);
      } catch (err) {
        console.error('Error loading subscriptions:', err);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Функція для форматування назви картки з великої літери
  const formatCardType = (cardType) => {
    if (!cardType) return '';
    return cardType.charAt(0).toUpperCase() + cardType.slice(1);
  };

  if (loading) {
    return <Container>Завантаження...</Container>;
  }

  if (!user) {
    return <Container>Помилка завантаження профілю</Container>;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar
            key={`profile-${user.photo || 'no-photo'}-${Date.now()}`} // Додаємо key для примусового оновлення
            sx={{ width: 80, height: 80, mr: 3, bgcolor: '#BB6830', color: '#FAF0E6' }}
            src={user.photo || null}
          >
            {user.first_name?.[0] || user.username?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h4">
              {user.first_name} {user.last_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
            <Chip
              label={user.card ? formatCardType(user.card.type) : 'Standard'}
              size="small"
              sx={{ 
                mt: 1,
                backgroundColor: user.card?.type === 'premium' ? '#BB6830' : '#1F5A4D', // egyptianEarth для Premium, emeraldGreen для Standard
                color: '#FAF0E6',
              }}
            />
          </Box>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            sx={{ 
              ml: 'auto',
              borderColor: '#9A5630', 
              color: '#9A5630',
              '&:hover': {
                borderColor: '#7A4520', 
                color: '#7A4520',
                backgroundColor: 'transparent', 
              },
              '&:active': {
                borderColor: '#693b1b', 
                color: '#693b1b',
                backgroundColor: 'transparent',
              },
            }}
            onClick={() => navigate('/client/profile/edit')}
          >
            Редагувати
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ backgroundColor: '#FAF6E6', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom>
                  <CardGiftcard sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Бонусні бали
                </Typography>
                <Typography variant="h4" color="primary">
                  {user.bonus_points || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Картка: {user.card ? formatCardType(user.card.type) : 'Standard'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Відображення активних абонементів */}
          {userSubscriptions.length > 0 && (
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, height: '100%' }}>
                {userSubscriptions.map((userSub) => {
                  const subscription = userSub.subscription;
                  const isSingle = subscription.type === 'single';
                  const isMonthly = subscription.type === 'monthly';
                  
                  // Форматуємо дати
                  const purchasedDate = new Date(userSub.purchased_at);
                  const purchasedDateStr = `${String(purchasedDate.getDate()).padStart(2, '0')}.${String(purchasedDate.getMonth() + 1).padStart(2, '0')}.${purchasedDate.getFullYear()}`;
                  
                  const endDate = new Date(userSub.end_date);
                  const endDateStr = `${String(endDate.getDate()).padStart(2, '0')}.${String(endDate.getMonth() + 1).padStart(2, '0')}.${endDate.getFullYear()}`;
                  
                  return (
                    <Card key={userSub.id} sx={{ flex: 1, height: '100%' }}>
                      <CardContent sx={{ backgroundColor: '#FAF6E6', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {isSingle ? 'Разовий абонемент' : isMonthly ? 'Місячний абонемент' : 'Корпоративний абонемент'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Придбано: {purchasedDateStr}
                          </Typography>
                          {isSingle ? (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: userSub.is_used ? 'text.secondary' : '#BB6830',
                                fontWeight: userSub.is_used ? 'normal' : '600'
                              }}
                            >
                              {userSub.is_used ? 'Використаний' : 'Не використаний'}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Дійсний до: {endDateStr}
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </Grid>
          )}
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              p: 2,
              borderRadius: 1,
              '&:hover': {
                '& .history-text': {
                  opacity: 0.8,
                },
              },
            }}
            onClick={() => navigate('/client/bookings')}
          >
            <History sx={{ mr: 1, verticalAlign: 'middle' }} />
            <Typography variant="h6" className="history-text" sx={{ transition: 'opacity 0.2s' }}>
              Історія бронювань
            </Typography>
          </Box>

          <Divider sx={{ my: 1 }} />

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              p: 2,
              borderRadius: 1,
              '&:hover': {
                '& .notifications-text': {
                  opacity: 0.8,
                },
              },
            }}
            onClick={() => navigate('/client/notifications')}
          >
            <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} />
            <Typography variant="h6" className="notifications-text" sx={{ transition: 'opacity 0.2s' }}>
              Сповіщення
            </Typography>
          </Box>

          <Divider sx={{ my: 1 }} />

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              p: 2,
              borderRadius: 1,
              '&:hover': {
                '& .subscriptions-text': {
                  opacity: 0.8,
                },
              },
            }}
            onClick={() => navigate('/client/subscriptions')}
          >
            <CardMembership sx={{ mr: 1, verticalAlign: 'middle' }} />
            <Typography variant="h6" className="subscriptions-text" sx={{ transition: 'opacity 0.2s' }}>
              Управління абонементами
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProfilePage;

