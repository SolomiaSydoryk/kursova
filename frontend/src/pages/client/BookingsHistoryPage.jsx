import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Chip,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/bookingService';

const BookingsHistoryPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const bookingsData = await bookingService.getMyBookings();
      setBookings(bookingsData);
    } catch (err) {
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Функція для отримання статусу бронювання 
  const getReservationStatus = (booking) => {
    if (booking.reservation_status === 'cancelled') {
      return 'Скасовано';
    }
    
    if (booking.section || booking.section_id) {
      // Для секцій: оплата на сайті → Підтверджено, оплата на місці → Очікує оплати
      if (booking.reservation_status === 'confirmed' && booking.payment_status === 'unpaid') {
        return 'Очікує оплати';
      }
      if (booking.reservation_status === 'confirmed') {
        return 'Підтверджено';
      }
      return 'Очікує оплати';
    } else {
      // Для залів: завжди Очікує підтвердження (поки адмін не підтвердить)
      if (booking.reservation_status === 'confirmed') {
        return 'Підтверджено';
      }
      return 'Очікує підтвердження';
    }
  };

  // Функція для отримання статусу оплати 
  const getPaymentStatus = (booking) => {
    // Перевіряємо, чи оплачено абонементом
    if (booking.used_subscription || booking.used_subscription_id) {
      return 'Оплачено абонементом';
    }
    if (booking.payment_status === 'paid') {
      return 'Оплачено';
    }
    if (booking.payment_status === 'error') {
      return 'Помилка';
    }
    // Для unpaid показуємо "Не оплачено"
    return 'Не оплачено';
  };

  // Функція для отримання кольорів статусу бронювання
  const getReservationStatusColors = (booking) => {
    const status = getReservationStatus(booking);
    
    if (status === 'Підтверджено') {
      return {
        backgroundColor: '#6B8A6B', 
        color: '#FAF0E6', 
      };
    }
    if (status === 'Очікує оплати' || status === 'Очікує підтвердження') {
      return {
        backgroundColor: '#BB6830', 
        color: '#FAF0E6', 
      };
    }
    // Скасовано
    return {
      backgroundColor: '#C62828', 
      color: '#FAF0E6', 
    };
  };

  // Функція для отримання кольорів статусу оплати
  const getPaymentStatusColors = (booking) => {
    const status = getPaymentStatus(booking);
    
    // "Оплачено абонементом" має такий самий колір як "Оплачено"
    if (status === 'Оплачено' || status === 'Оплачено абонементом') {
      return {
        backgroundColor: '#6B8A6B', 
        color: '#FAF0E6', 
      };
    }
    // "Не оплачено" має колір egyptianEarth
    if (status === 'Не оплачено') {
      return {
        backgroundColor: '#BB6830', // egyptianEarth
        color: '#FAF0E6',
      };
    }
    // Помилка
    return {
      backgroundColor: '#C62828', 
      color: '#FAF0E6', 
    };
  };

  // Форматування дати
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      return date.toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Форматування часу
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      // Якщо це об'єкт Time або рядок у форматі HH:MM:SS або HH:MM
      let time = typeof timeStr === 'string' ? timeStr : timeStr.toString();
      // Якщо формат HH:MM:SS, беремо тільки HH:MM
      if (time.length > 5) {
        time = time.substring(0, 5);
      }
      return time;
    } catch (e) {
      return '';
    }
  };

  // Отримання назви рівня підготовки 
  const getPreparationLevelLabel = (level) => {
    const labels = {
      'beginner': 'Початковий',
      'intermediate': 'Середній',
      'advanced': 'Просунутий',
    };
    return labels[level] || level;
  };

  // Отримання назви виду спорту 
  const getSportTypeLabel = (sportType) => {
    const labels = {
      fitness: 'Фітнес',
      swimming: 'Плавання',
      pilates: 'Пілатес',
      volleyball: 'Волейбол',
      tennis: 'Теніс',
      yoga: 'Йога',
    };
    return labels[sportType] || sportType;
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
            Історія бронювань
          </Typography>
        </Box>

        {bookings.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            Немає бронювань
          </Typography>
        ) : (
          <Box>
            {bookings.map((booking) => (
              <Card 
                key={booking.id} 
                sx={{ 
                  mb: 2,
                  backgroundColor: '#FAF6E6', 
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      {booking.section || booking.section_id ? (
                        // Для секції
                        <>
                          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                            Секція: {getSportTypeLabel(booking.section_sport_type || '')} | {getPreparationLevelLabel(booking.section_preparation_level || '')} рівень
                          </Typography>
                          <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
                            Зал: {booking.hall_name}
                          </Typography>
                          {booking.section_trainer_name && (
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
                              Тренер: {booking.section_trainer_name}
                            </Typography>
                          )}
                          <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
                            Дата і час: {booking.timeslot_date 
                              ? formatDate(booking.timeslot_date) 
                              : (booking.timeslot_display ? booking.timeslot_display.split(' ')[0] : '')} {booking.timeslot_start_time && booking.timeslot_end_time 
                              ? `${formatTime(booking.timeslot_start_time)}-${formatTime(booking.timeslot_end_time)}`
                              : ''}
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#BB6830', mt: 1 }}>
                            Ціна: {booking.price} ₴
                          </Typography>
                        </>
                      ) : (
                        // Для залу
                        <>
                          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                            Зал {booking.hall_name}
                          </Typography>
                          {booking.hall_event_type && (
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                              Вид спорту: {(() => {
                                const labels = {
                                  fitness: 'Фітнес',
                                  swimming: 'Плавання',
                                  pilates: 'Пілатес',
                                  volleyball: 'Волейбол',
                                  tennis: 'Теніс',
                                  yoga: 'Йога',
                                };
                                return labels[booking.hall_event_type] || booking.hall_event_type;
                              })()}
                            </Typography>
                          )}
                          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                            Дата: {booking.timeslot_date 
                              ? formatDate(booking.timeslot_date) 
                              : (booking.timeslot_display ? booking.timeslot_display.split(' ')[0] : '')}
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#BB6830' }}>
                            Ціна: {booking.price} ₴
                          </Typography>
                        </>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, ml: 2, alignItems: 'flex-end' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, display: 'block', pl: 2 }}>
                          Статус бронювання
                        </Typography>
                        <Chip
                          label={getReservationStatus(booking)}
                          sx={{
                            ...getReservationStatusColors(booking),
                            fontWeight: 500,
                            minWidth: 200,
                            height: 36,
                            borderRadius: '18px',
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, display: 'block', pl: 2 }}>
                          Стан оплати
                        </Typography>
                        <Chip
                          label={getPaymentStatus(booking)}
                          sx={{
                            ...getPaymentStatusColors(booking),
                            fontWeight: 500,
                            minWidth: 200, 
                            height: 36,
                            borderRadius: '18px',
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default BookingsHistoryPage;

