import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { CreditCard, AccountBalance } from '@mui/icons-material';
import { bookingService } from '../../services/bookingService';
import { authService } from '../../services/authService';

const PaymentDialog = ({ open, onClose, onSuccess, reservation }) => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [useBonusPoints, setUseBonusPoints] = useState(false);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [availablePoints, setAvailablePoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      loadUserPoints();
    }
  }, [open]);

  const loadUserPoints = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user?.bonus_points) {
        setAvailablePoints(user.bonus_points);
      }
    } catch (err) {
      console.error('Error loading user points:', err);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const bookingData = {
        hall: reservation.type === 'hall' ? reservation.hall.id : null,
        section: reservation.type === 'section' ? reservation.section.id : null,
        timeslot: reservation.timeslot.id,
        seats: 1,
        payment_method: paymentMethod,
        use_bonus_points: useBonusPoints,
        bonus_points: useBonusPoints ? bonusPoints : 0,
      };

      await bookingService.createBooking(bookingData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка створення бронювання');
    } finally {
      setLoading(false);
    }
  };

  const finalPrice = reservation.price - (useBonusPoints ? (bonusPoints * 0.01) : 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Підтвердження замовлення</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {reservation.type === 'section' ? 'Секція' : 'Зал'}:{' '}
            {reservation.type === 'section'
              ? reservation.section.sport_type
              : reservation.hall.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Дата: {new Date(reservation.timeslot.date).toLocaleDateString('uk-UA')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Час: {reservation.timeslot.start_time.substring(0, 5)} -{' '}
            {reservation.timeslot.end_time.substring(0, 5)}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {availablePoints > 0 && (
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <input
                  type="checkbox"
                  checked={useBonusPoints}
                  onChange={(e) => setUseBonusPoints(e.target.checked)}
                />
              }
              label={`Використати бонусні бали (доступно: ${availablePoints})`}
            />
            {useBonusPoints && (
              <TextField
                fullWidth
                type="number"
                label="Кількість балів"
                value={bonusPoints}
                onChange={(e) => {
                  const value = Math.min(
                    parseInt(e.target.value) || 0,
                    availablePoints,
                    Math.floor(reservation.price * 100)
                  );
                  setBonusPoints(value);
                }}
                inputProps={{ min: 0, max: availablePoints }}
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        )}

        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">Спосіб оплати</FormLabel>
          <RadioGroup
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <FormControlLabel
              value="card"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CreditCard />
                  <span>Картка</span>
                </Box>
              }
            />
            <FormControlLabel
              value="cash"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountBalance />
                  <span>Готівка (на місці)</span>
                </Box>
              }
            />
          </RadioGroup>
        </FormControl>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">До сплати:</Typography>
          <Typography variant="h6" color="primary">
            {finalPrice.toFixed(2)} ₴
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Скасувати
        </Button>
        <Button
          onClick={handlePayment}
          variant="contained"
          disabled={loading || finalPrice < 0}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Обробка...' : 'Підтвердити та оплатити'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDialog;

