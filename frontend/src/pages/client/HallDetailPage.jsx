import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { hallService } from '../../services/hallService';
import TimeSlotSelector from '../../components/bookings/TimeSlotSelector';
import PaymentDialog from '../../components/bookings/PaymentDialog';

const HallDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hall, setHall] = useState(null);
  const [timeslots, setTimeslots] = useState([]);
  const [selectedTimeslot, setSelectedTimeslot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  useEffect(() => {
    loadHall();
    loadTimeslots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadHall = async () => {
    try {
      const data = await hallService.getById(id);
      setHall(data);
    } catch (err) {
      setError('Помилка завантаження залу');
    } finally {
      setLoading(false);
    }
  };

  const loadTimeslots = async () => {
    try {
      const data = await hallService.getAvailableTimeslots(id);
      setTimeslots(data);
    } catch (err) {
      console.error('Error loading timeslots:', err);
    }
  };

  const handleTimeslotSelect = (timeslot) => {
    setSelectedTimeslot(timeslot);
  };

  const handleBook = () => {
    if (selectedTimeslot) {
      setPaymentOpen(true);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentOpen(false);
    navigate('/client/bookings');
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !hall) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error || 'Зал не знайдено'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/client/catalog')}
        sx={{ mb: 3 }}
      >
        Назад до каталогу
      </Button>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              {hall.name}
            </Typography>

            {hall.event_type && (
              <Chip label={hall.event_type} color="primary" sx={{ mb: 2 }} />
            )}

            <Divider sx={{ my: 2 }} />

            {hall.room_number && (
              <Typography variant="body1" gutterBottom>
                <strong>Номер:</strong> {hall.room_number}
              </Typography>
            )}

            <Typography variant="body1" gutterBottom>
              <strong>Місткість:</strong> {hall.capacity} осіб
            </Typography>

            <Typography variant="h5" color="primary" sx={{ mt: 3 }}>
              {hall.price} ₴
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Виберіть дату та час
            </Typography>

            <TimeSlotSelector
              timeslots={timeslots}
              selectedTimeslot={selectedTimeslot}
              onSelect={handleTimeslotSelect}
            />

            {selectedTimeslot && (
              <Box sx={{ mt: 3 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleBook}
                >
                  Забронювати за {hall.price} ₴
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <PaymentDialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSuccess={handlePaymentSuccess}
        reservation={{
          type: 'hall',
          hall: hall,
          timeslot: selectedTimeslot,
          price: hall.price,
        }}
      />
    </Container>
  );
};

export default HallDetailPage;

