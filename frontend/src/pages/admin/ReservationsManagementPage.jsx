import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Refresh,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/bookingService';

const ReservationsManagementPage = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, reservation: null, action: null });

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    setLoading(true);
    setError(null);
    try {
      // Отримуємо всі бронювання залів зі статусом pending
      const allReservations = await bookingService.getAllReservations();
      // Фільтруємо тільки зали зі статусом pending
      const hallReservations = allReservations.filter(
        res => res.hall && !res.section && res.reservation_status === 'pending'
      );
      setReservations(hallReservations);
    } catch (err) {
      setError('Помилка завантаження бронювань');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = (reservation) => {
    setConfirmDialog({
      open: true,
      reservation,
      action: 'confirm',
    });
  };

  const handleReject = (reservation) => {
    setConfirmDialog({
      open: true,
      reservation,
      action: 'reject',
    });
  };

  const handleDialogClose = () => {
    setConfirmDialog({ open: false, reservation: null, action: null });
  };

  const handleDialogConfirm = async () => {
    const { reservation, action } = confirmDialog;
    try {
      if (action === 'confirm') {
        await bookingService.updateReservationStatus(reservation.id, 'confirmed');
      } else {
        await bookingService.updateReservationStatus(reservation.id, 'cancelled');
      }
      handleDialogClose();
      loadReservations();
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка оновлення статусу');
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
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
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            onClick={() => navigate('/admin/dashboard')}
            sx={{ 
              color: '#FAF0E6',
              minWidth: 'auto',
              padding: '8px',
            }}
          >
            <ArrowBack />
          </Button>
          <Typography variant="h5" sx={{ color: '#FAF0E6', fontWeight: 600 }}>
            Управління бронюваннями залів
          </Typography>
        </Box>
        <Button
          startIcon={<Refresh />}
          onClick={loadReservations}
          sx={{
            backgroundColor: '#1F5A4D',
            color: '#FAF0E6',
            '&:hover': {
              backgroundColor: '#153D33',
            },
          }}
        >
          Оновити
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {reservations.length === 0 ? (
        <Paper sx={{ p: 4, backgroundColor: '#FAF0E6', textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Немає бронювань залів, що очікують підтвердження
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ backgroundColor: '#FAF0E6' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#1F5A4D' }}>
                <TableCell sx={{ color: '#FAF0E6', fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ color: '#FAF0E6', fontWeight: 600 }}>Користувач</TableCell>
                <TableCell sx={{ color: '#FAF0E6', fontWeight: 600 }}>Зал</TableCell>
                <TableCell sx={{ color: '#FAF0E6', fontWeight: 600 }}>Дата</TableCell>
                <TableCell sx={{ color: '#FAF0E6', fontWeight: 600 }}>Ціна</TableCell>
                <TableCell sx={{ color: '#FAF0E6', fontWeight: 600 }}>Статус оплати</TableCell>
                <TableCell sx={{ color: '#FAF0E6', fontWeight: 600 }}>Створено</TableCell>
                <TableCell sx={{ color: '#FAF0E6', fontWeight: 600 }}>Дії</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reservations.map((reservation) => (
                <TableRow key={reservation.id} hover>
                  <TableCell>#{reservation.id}</TableCell>
                  <TableCell>
                    {reservation.customer_first_name} {reservation.customer_last_name}
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      {reservation.customer_email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {reservation.hall_name}
                    {reservation.hall_event_type && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {(() => {
                          const labels = {
                            fitness: 'Фітнес',
                            swimming: 'Плавання',
                            pilates: 'Пілатес',
                            volleyball: 'Волейбол',
                            tennis: 'Теніс',
                            yoga: 'Йога',
                          };
                          return labels[reservation.hall_event_type] || reservation.hall_event_type;
                        })()}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(reservation.timeslot_date)}</TableCell>
                  <TableCell>{reservation.price} ₴</TableCell>
                  <TableCell>
                    <Chip
                      label={reservation.payment_status === 'paid' ? 'Оплачено' : 'Не оплачено'}
                      size="small"
                      color={reservation.payment_status === 'paid' ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell>{formatDateTime(reservation.created_at)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={() => handleConfirm(reservation)}
                        sx={{
                          backgroundColor: '#6B8A6B',
                          '&:hover': {
                            backgroundColor: '#5A7A5A',
                          },
                        }}
                      >
                        Підтвердити
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={() => handleReject(reservation)}
                        sx={{
                          backgroundColor: '#C62828',
                          '&:hover': {
                            backgroundColor: '#B71C1C',
                          },
                        }}
                      >
                        Відхилити
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={confirmDialog.open} onClose={handleDialogClose}>
        <DialogTitle>
          {confirmDialog.action === 'confirm' ? 'Підтвердити бронювання?' : 'Відхилити бронювання?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.action === 'confirm' 
              ? 'Ви впевнені, що хочете підтвердити це бронювання залу? Користувач отримає сповіщення про підтвердження.'
              : 'Ви впевнені, що хочете відхилити це бронювання? Користувач отримає сповіщення про відхилення.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleDialogClose}
            sx={{
              backgroundColor: '#BB6830',
              color: '#FAF0E6',
              '&:hover': {
                backgroundColor: '#9A5420',
              },
            }}
          >
            Скасувати
          </Button>
          <Button
            onClick={handleDialogConfirm}
            variant="contained"
            sx={{
              backgroundColor: confirmDialog.action === 'confirm' ? '#6B8A6B' : '#C62828',
              '&:hover': {
                backgroundColor: confirmDialog.action === 'confirm' ? '#5A7A5A' : '#B71C1C',
              },
            }}
          >
            {confirmDialog.action === 'confirm' ? 'Підтвердити' : 'Відхилити'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ReservationsManagementPage;

