import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Close, CalendarToday, AccessTime, ErrorOutline } from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { uk } from 'date-fns/locale';
import { bookingService } from '../../services/bookingService';
import { useNavigate } from 'react-router-dom';

const BookingDialog = ({ open, onClose, section, hall }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeslot, setSelectedTimeslot] = useState(null);
  const [availableTimeslots, setAvailableTimeslots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const isSection = !!section;
  const isHall = !!hall;

  useEffect(() => {
    if (open) {
      loadAvailableTimeslots();
    } else {
      // Скидаємо стан при закритті
      setSelectedDate(null);
      setSelectedTimeslot(null);
      setAvailableTimeslots([]);
      setError(null);
    }
  }, [open, section, hall]);

  const loadAvailableTimeslots = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingService.getAvailableTimeslots(
        section?.id || null,
        hall?.id || null
      );
      setAvailableTimeslots(data);
    } catch (err) {
      setError('Помилка завантаження доступних слотів');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date) => {
    if (!date) return;
    
    // Перевіряємо, чи є доступні timeslots на цю дату
    const dateStr = date.toISOString().split('T')[0];
    const slotsForDate = availableTimeslots.filter(
      slot => slot.date === dateStr
    );

    if (isHall) {
      // Для залу - дозволяємо вибір дати навіть якщо зал заброньований або є секції
      // (кнопка підтвердження буде неактивною)
      if (slotsForDate.length > 0) {
        setSelectedDate(date);
        setSelectedTimeslot(slotsForDate[0]);
        setError(null);
      } else {
        // Якщо немає timeslots на цю дату, все одно дозволяємо вибір
        // (можливо, дата поза доступним діапазоном)
        setSelectedDate(date);
        setSelectedTimeslot(null);
        setError(null);
      }
    } else {
      // Для секції - просто вибираємо дату
      setSelectedDate(date);
      setSelectedTimeslot(null);
    }
  };

  const handleTimeslotSelect = (timeslot) => {
    setSelectedTimeslot(timeslot);
    setError(null);
  };

  const handleConfirm = () => {
    if (!selectedTimeslot) return;

    // Переходимо на сторінку підтвердження
    const bookingData = {
      section: section?.id || null,
      hall: hall?.id || null,
      timeslot: selectedTimeslot.id,
    };

    navigate('/client/booking/confirm', { 
      state: { 
        bookingData,
        section,
        hall,
        selectedTimeslot,
        returnPath: '/client/catalog',
        returnData: { section, hall },
      } 
    });
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  // Групуємо timeslots по датах
  const groupedByDate = availableTimeslots.reduce((acc, slot) => {
    const date = slot.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(slot);
    return acc;
  }, {});

  // Отримуємо доступні дати
  const availableDates = Object.keys(groupedByDate).sort();

  // Для залу - перевіряємо, чи вибрана дата доступна
  const isDateAvailable = (date) => {
    if (!date) return false;
    const dateStr = date.toISOString().split('T')[0];
    return availableDates.includes(dateStr);
  };

  // Отримуємо timeslots для вибраної дати
  const timeslotsForSelectedDate = selectedDate
    ? groupedByDate[selectedDate.toISOString().split('T')[0]] || []
    : [];

  // Для залу - перевіряємо чи зал доступний (не заброньований і немає секцій)
  const canConfirm = selectedTimeslot && !error && (
    !isHall || (!selectedTimeslot.is_booked && !selectedTimeslot.has_sections)
  );

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#FAF0E6',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {isSection ? 'Бронювання секції' : 'Бронювання залу'}
        </Typography>
        <IconButton onClick={handleCancel} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : error && !selectedDate ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
              <CalendarToday sx={{ mr: 1, verticalAlign: 'middle' }} />
              Виберіть дату:
            </Typography>

            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={uk}>
              <DateCalendar
                value={selectedDate}
                onChange={handleDateSelect}
                minDate={new Date()}
                maxDate={new Date(new Date().getFullYear() + 1, 11, 31)} // Кінець наступного року
                shouldDisableDate={(date) => !isDateAvailable(date)}
                sx={{
                  '& .MuiPickersDay-root': {
                    '&.Mui-disabled': {
                      opacity: 0.3,
                    },
                  },
                  '& .MuiPickersYear-yearButton': {
                    '&.Mui-selected': {
                      backgroundColor: '#111A19', 
                      color: '#FAF0E6', 
                      '&:hover': {
                        backgroundColor: '#111A19',
                      },
                    },
                    '&:not(.Mui-selected)': {
                      '&:hover': {
                        backgroundColor: '#1F5A4D',
                        color: '#FAF0E6',
                      },
                    },
                  },
                }}
              />
            </LocalizationProvider>

            {isHall && selectedDate && !isDateAvailable(selectedDate) && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                На цей день зал вже заброньовано
              </Alert>
            )}

            {isSection && selectedDate && timeslotsForSelectedDate.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
                  <AccessTime sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Виберіть час:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {timeslotsForSelectedDate.map((slot) => {
                    const isAvailable = slot.available_seats > 0;
                    const isSelected = selectedTimeslot?.id === slot.id;

                    return (
                      <Button
                        key={slot.id}
                        variant={isSelected ? 'contained' : 'outlined'}
                        disabled={!isAvailable}
                        onClick={() => handleTimeslotSelect(slot)}
                        sx={{
                          minWidth: 120,
                          textDecoration: !isAvailable ? 'line-through' : 'none',
                          opacity: !isAvailable ? 0.5 : 1,
                          backgroundColor: isAvailable && !isSelected ? '#1F5A4D' : undefined,
                          color: isAvailable ? '#FAF0E6' : undefined, 
                          borderColor: isAvailable && !isSelected ? '#1F5A4D' : undefined,
                          '&:hover': {
                            backgroundColor: isAvailable && !isSelected ? '#153D33' : undefined, 
                            borderColor: isAvailable && !isSelected ? '#153D33' : undefined,
                          },
                          '&.Mui-disabled': {
                            backgroundColor: '#9E9E9E', 
                            color: '#757575',
                          },
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ color: isAvailable ? '#FAF0E6' : 'inherit' }}>
                            {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                          </Typography>
                          {isAvailable && (
                            <Typography variant="caption" display="block" sx={{ color: '#FAF0E6' }}>
                              {slot.available_seats} місць
                            </Typography>
                          )}
                        </Box>
                      </Button>
                    );
                  })}
                </Box>
                {timeslotsForSelectedDate.every(slot => slot.available_seats === 0) && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    На цю дату всі місця зайняті
                  </Alert>
                )}
              </Box>
            )}

            {isHall && selectedTimeslot && (
              <Box sx={{ mt: 2 }}>
                {(selectedTimeslot.is_booked || selectedTimeslot.has_sections) ? (
                  <Alert 
                    severity="error"
                    icon={<ErrorOutline />}
                    sx={{
                      backgroundColor: '#F5E6D3', 
                      color: 'text.primary',
                      '& .MuiAlert-icon': {
                        color: '#BB6830', 
                      },
                    }}
                  >
                    Зал недоступний на {selectedDate?.toLocaleDateString('uk-UA', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Alert>
                ) : (
                  <Alert 
                    severity="success"
                    sx={{
                      backgroundColor: '#6B8A6B',
                      color: '#FAF0E6', 
                      '& .MuiAlert-icon': {
                        color: '#FAF0E6',
                      },
                    }}
                  >
                    Зал доступний на {selectedDate?.toLocaleDateString('uk-UA', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          onClick={handleCancel}
          variant="outlined"
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
          onClick={handleConfirm}
          variant="contained"
          disabled={!canConfirm}
          sx={{
            backgroundColor: canConfirm ? '#1F5A4D' : '#9E9E9E',
            color: canConfirm ? '#FAF0E6' : '#757575', 
            '&:hover': {
              backgroundColor: canConfirm ? '#153D33' : '#9E9E9E', 
            },
            '&.Mui-disabled': {
              backgroundColor: '#9E9E9E', 
              color: '#757575', 
            },
          }}
        >
          {isHall ? 'Підтвердити дату' : 'Підтвердити дату і час'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookingDialog;

