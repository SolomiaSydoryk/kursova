import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Button,
  CardActions,
} from '@mui/material';
import { MeetingRoom } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import BookingDialog from '../bookings/BookingDialog';

const HallCard = ({ hall }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  // Перевіряємо, чи потрібно відкрити діалог при поверненні зі сторінки підтвердження
  useEffect(() => {
    // Перевіряємо тільки якщо є openDialog і це саме наш зал, і діалог ще не відкритий
    if (location.state?.openDialog && location.state?.hall?.id === hall.id && !bookingDialogOpen) {
      setBookingDialogOpen(true);
      // Очищаємо state, щоб не відкривати діалог при наступних навігаціях
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.openDialog, location.state?.hall?.id, hall.id, navigate, location.pathname, bookingDialogOpen]);

  const handleViewDetails = () => {
    setBookingDialogOpen(true);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardMedia
        sx={{
          height: 160,
          backgroundColor: 'secondary.light',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ fontSize: 64, color: 'primary.main' }}>
          <MeetingRoom />
        </Box>
      </CardMedia>

      <CardContent sx={{ flexGrow: 1, backgroundColor: '#FAF0E6' }}>
        <Typography variant="h6" component="h2" gutterBottom>
          {hall.name}
        </Typography>

        {hall.event_type && (
          <Chip
            label={(() => {
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
            size="small"
            color="primary"
            variant="outlined"
            sx={{ mb: 1 }}
          />
        )}

        {hall.room_number && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Номер: {hall.room_number}
          </Typography>
        )}

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Місткість: {hall.capacity} осіб
        </Typography>

        <Typography 
          variant="h6" 
          sx={{ 
            color: 'accent.main',
            mt: 2,
            mb: 1,
            fontWeight: 600,
          }}
        >
          {hall.price} ₴
        </Typography>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleViewDetails}
        >
          Переглянути вільні дати
        </Button>
      </CardActions>

      <BookingDialog
        open={bookingDialogOpen}
        onClose={() => setBookingDialogOpen(false)}
        hall={hall}
      />
    </Card>
  );
};

export default HallCard;

