import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import {
  CreditCard,
  AttachMoney,
  CheckCircle,
  CardMembership,
} from '@mui/icons-material';
import { bookingService } from '../../services/bookingService';
import { authService } from '../../services/authService';
import { subscriptionService } from '../../services/subscriptionService';

const BookingConfirmPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingData, section, hall, selectedTimeslot, returnPath, returnData } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successTimeout, setSuccessTimeout] = useState(null);
  const [availableSubscriptions, setAvailableSubscriptions] = useState([]);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(null);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [user, setUser] = useState(null);

  const isSection = !!section;
  const isHall = !!hall;

  useEffect(() => {
    if (!bookingData || !selectedTimeslot) {
      navigate('/client/catalog');
    }
    
    // Завантажуємо дані користувача для перевірки картки
    authService.getCurrentUser().then(setUser).catch(console.error);
    
    // Завантажуємо доступні абонементи для секцій
    if (isSection) {
      loadAvailableSubscriptions();
    }
  }, [bookingData, selectedTimeslot, navigate, isSection]);
  
  const loadAvailableSubscriptions = async () => {
    try {
      setLoadingSubscriptions(true);
      const subscriptions = await subscriptionService.getMySubscriptions();
      // Фільтруємо тільки ті, що можна використати
      const usable = subscriptions.filter(sub => sub.can_be_used && sub.is_valid);
      setAvailableSubscriptions(usable);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  useEffect(() => {
    return () => {
      if (successTimeout) {
        clearTimeout(successTimeout);
      }
    };
  }, [successTimeout]);

  if (!bookingData || !selectedTimeslot) {
    return null;
  }

  // Розраховуємо ціну з урахуванням знижки для Premium картки
  const calculatePrice = () => {
    let basePrice = parseFloat(isSection ? section.price : hall.price);
    
    // Якщо користувач має Premium картку і це секція плавання - застосовуємо знижку 50%
    if (user?.card?.type === 'premium' && isSection && section.sport_type === 'swimming') {
      return parseFloat((basePrice * 0.5).toFixed(2));
    }
    
    return basePrice;
  };

  const price = calculatePrice();

  const handlePaymentChange = (event) => {
    const value = event.target.value;
    setPaymentMethod(value);
    // Якщо вибрано абонемент, відкриваємо діалог вибору
    if (value === 'subscription') {
      setSubscriptionDialogOpen(true);
    } else {
      setSelectedSubscriptionId(null);
    }
  };

  const handleSubscriptionSelect = (subscriptionId) => {
    setSelectedSubscriptionId(subscriptionId);
    setSubscriptionDialogOpen(false);
  };

  const getSubscriptionLabel = (userSub) => {
    const subscription = userSub.subscription;
    if (subscription.type === 'single') {
      return 'Разовий абонемент';
    } else if (subscription.type === 'monthly') {
      return 'Місячний абонемент';
    }
  };

  const handleConfirm = async () => {
    // Перевіряємо, чи вибрано абонемент, якщо обрано спосіб оплати абонементом
    if (paymentMethod === 'subscription' && !selectedSubscriptionId) {
      setError('Будь ласка, оберіть абонемент для оплати');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Переконуємося, що section/hall передаються як числа або null
      const data = {
        section: bookingData.section ? Number(bookingData.section) : null,
        hall: bookingData.hall ? Number(bookingData.hall) : null,
        timeslot: Number(bookingData.timeslot),
        payment_method: paymentMethod === 'subscription' ? 'subscription' : (paymentMethod === 'card' ? 'card' : 'cash'),
        seats: 1,
      };
      
      // Якщо використовується абонемент, додаємо його ID
      if (paymentMethod === 'subscription' && selectedSubscriptionId) {
        data.user_subscription_id = selectedSubscriptionId;
      }

      console.log('Sending booking data:', data); // Для дебагу

      await bookingService.createBooking(data);
      setSuccess(true);

      // Перенаправляємо на профіль через 7 секунд або поки користувач не закриє
      const timeout = setTimeout(() => {
        navigate('/client/profile');
      }, 7000);
      setSuccessTimeout(timeout);
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка створення бронювання');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    return timeStr.substring(0, 5);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #111A19 0%, #111A19 35%, #BB6830 65%, #BB6830 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper sx={{ p: 4, backgroundColor: '#FAF0E6' }}>
          {success ? (
            <Box textAlign="center">
              <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                Бронювання підтверджено!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {isHall 
                  ? 'Ваше бронювання залу відправлено на розгляд. Адміністратор зв\'яжеться з вами для уточнення деталей. Ви будете перенаправлені на сторінку профілю через 7 секунд.'
                  : 'Ваше бронювання успішно створено. Ви будете перенаправлені на сторінку профілю через 7 секунд.'
                }
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  if (successTimeout) {
                    clearTimeout(successTimeout);
                  }
                  navigate('/client/profile');
                }}
                sx={{ color: '#FAF0E6' }}
              >
                Перейти до профілю зараз
              </Button>
            </Box>
          ) : (
            <>
              <Typography variant="h4" gutterBottom>
                Підтвердження бронювання
              </Typography>
              <Divider sx={{ my: 3 }} />

              {/* Інформація про бронювання */}
              <Card sx={{ mb: 3, backgroundColor: '#F5E6D3' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Деталі бронювання
                  </Typography>

                  {isSection && (
                    <>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Секція:</strong> {(() => {
                          const labels = {
                            fitness: 'Фітнес',
                            swimming: 'Плавання',
                            pilates: 'Пілатес',
                            volleyball: 'Волейбол',
                            tennis: 'Теніс',
                            yoga: 'Йога',
                          };
                          return labels[section.sport_type] || section.sport_type;
                        })()}
                      </Typography>
                      {section.trainer_name && (
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          <strong>Тренер:</strong> {section.trainer_name}
                        </Typography>
                      )}
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Зал:</strong> {section.hall_name || section.hall_room_number}
                      </Typography>
                    </>
                  )}

                  {isHall && (
                    <>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Зал:</strong> {hall.name}
                      </Typography>
                      {hall.event_type && (
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          <strong>Вид спорту:</strong> {(() => {
                            const labels = {
                              fitness: 'Фітнес',
                              swimming: 'Плавання',
                              pilates: 'Пілатес',
                              volleyball: 'Волейбол',
                              tennis: 'Теніс',
                              yoga: 'Йога',
                            };
                            return labels[hall.event_type] || hall.event_type;
                          })()}
                        </Typography>
                      )}
                    </>
                  )}

                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Дата:</strong> {formatDate(selectedTimeslot.date)}
                  </Typography>
                  {isSection && (
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Час:</strong> {formatTime(selectedTimeslot.start_time)} - {formatTime(selectedTimeslot.end_time)}
                    </Typography>
                  )}
                  <Typography variant="h6" sx={{ mt: 2, color: 'accent.main' }}>
                    <strong>Вартість:</strong> {price} ₴
                  </Typography>
                </CardContent>
              </Card>

              {/* Повідомлення для залу */}
              {isHall && (
                <Alert 
                  severity="warning"
                  sx={{ 
                    mb: 3, 
                    backgroundColor: '#F5E6D3',
                    '& .MuiAlert-icon': {
                      color: '#BB6830', 
                    },
                  }}
                >
                  <Typography variant="body1">
                    <strong>Важливо:</strong> Після підтвердження бронювання адміністратор зв'яжеться з вами для уточнення деталей щодо бронювання залу.
                  </Typography>
                </Alert>
              )}

              {/* Вибір способу оплати */}
              <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                <FormLabel component="legend" sx={{ mb: 2 }}>
                  <Typography variant="h6">Спосіб оплати</Typography>
                </FormLabel>
                <RadioGroup
                  value={paymentMethod}
                  onChange={handlePaymentChange}
                >
                  <FormControlLabel
                    value="card"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CreditCard />
                        <Typography>Оплата онлайн картою</Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="cash"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachMoney />
                        <Typography>Оплатити на місці</Typography>
                      </Box>
                    }
                  />
                  {/* Опція використання абонемента - тільки для секцій і якщо є доступні абонементи */}
                  {isSection && availableSubscriptions.length > 0 && (
                    <FormControlLabel
                      value="subscription"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CardMembership />
                          <Typography>
                            Доступне використання абонементу
                            {selectedSubscriptionId && (
                              <Typography component="span" sx={{ ml: 1, fontSize: '0.875rem', color: 'text.secondary' }}>
                                (вибрано)
                              </Typography>
                            )}
                          </Typography>
                        </Box>
                      }
                    />
                  )}
                </RadioGroup>
              </FormControl>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    // Повертаємося до каталогу з інформацією для відкриття діалогу
                    navigate(returnPath || '/client/catalog', {
                      state: {
                        openDialog: true,
                        ...returnData,
                      },
                    });
                  }}
                  disabled={loading}
                  sx={{
                    backgroundColor: '#BB6830', 
                    color: '#FAF0E6', 
                    borderColor: '#BB6830',
                    '&:hover': {
                      backgroundColor: '#9A5420', 
                      borderColor: '#9A5420',
                    },
                  }}
                >
                  Скасувати
                </Button>
                <Button
                  variant="contained"
                  onClick={handleConfirm}
                  disabled={loading}
                  sx={{ color: '#FAF0E6' }}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Підтвердження...' : 'Підтвердити бронювання'}
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Container>

      {/* Діалог вибору абонемента */}
      <Dialog 
        open={subscriptionDialogOpen} 
        onClose={() => {
          setSubscriptionDialogOpen(false);
          // Якщо закриваємо без вибору, повертаємося до попереднього способу оплати
          if (!selectedSubscriptionId) {
            setPaymentMethod('card');
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Оберіть абонемент</DialogTitle>
        <DialogContent>
          {loadingSubscriptions ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : availableSubscriptions.length === 0 ? (
            <Typography variant="body1" color="text.secondary">
              Немає доступних абонементів
            </Typography>
          ) : (
            <List>
              {availableSubscriptions.map((userSub) => (
                <ListItem key={userSub.id} disablePadding>
                  <ListItemButton
                    selected={selectedSubscriptionId === userSub.id}
                    onClick={() => handleSubscriptionSelect(userSub.id)}
                  >
                    <ListItemText
                      primary={getSubscriptionLabel(userSub)}
                      secondary={
                        userSub.subscription.type === 'single'
                          ? 'Одне використання'
                          : `Дійсний до: ${new Date(userSub.end_date).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setSubscriptionDialogOpen(false);
              setPaymentMethod('card');
              setSelectedSubscriptionId(null);
            }}
            sx={{ color: '#111A19' }}
          >
            Скасувати
          </Button>
          <Button
            onClick={() => {
              if (selectedSubscriptionId) {
                setSubscriptionDialogOpen(false);
              }
            }}
            variant="contained"
            disabled={!selectedSubscriptionId}
            sx={{
              backgroundColor: '#1F5A4D',
              color: '#FAF0E6',
              '&:hover': {
                backgroundColor: '#153D33',
              },
            }}
          >
            Підтвердити
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookingConfirmPage;

