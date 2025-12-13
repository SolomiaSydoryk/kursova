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
import { sectionService } from '../../services/sectionService';
import TimeSlotSelector from '../../components/bookings/TimeSlotSelector';
import PaymentDialog from '../../components/bookings/PaymentDialog';

const SectionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [section, setSection] = useState(null);
  const [timeslots, setTimeslots] = useState([]);
  const [selectedTimeslot, setSelectedTimeslot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  useEffect(() => {
    loadSection();
    loadTimeslots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadSection = async () => {
    try {
      const data = await sectionService.getById(id);
      setSection(data);
    } catch (err) {
      setError('Помилка завантаження секції');
    } finally {
      setLoading(false);
    }
  };

  const loadTimeslots = async () => {
    try {
      const data = await sectionService.getAvailableTimeslots(id);
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

  if (error || !section) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error || 'Секцію не знайдено'}
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
              {section.sport_type}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip label={section.preparation_level} color="primary" />
              {section.trainer_name && (
                <Chip label={`Тренер: ${section.trainer_name}`} />
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body1" gutterBottom>
              <strong>Зал:</strong> {section.hall_name}
            </Typography>

            {section.min_age && section.max_age && (
              <Typography variant="body1" gutterBottom>
                <strong>Вік:</strong> {section.min_age} - {section.max_age} років
              </Typography>
            )}

            <Typography variant="body1" gutterBottom>
              <strong>Вільних місць:</strong> {section.available_seats || section.seats_limit}
            </Typography>

            <Typography variant="h5" color="primary" sx={{ mt: 3 }}>
              {section.price} ₴
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
                  Забронювати за {section.price} ₴
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
          type: 'section',
          section: section,
          timeslot: selectedTimeslot,
          price: section.price,
        }}
      />
    </Container>
  );
};

export default SectionDetailPage;

