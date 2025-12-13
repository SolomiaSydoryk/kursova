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
import {
  FitnessCenter,
  Pool,
  SelfImprovement,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import BookingDialog from '../bookings/BookingDialog';
import { authService } from '../../services/authService';

const SectionCard = ({ section }) => {
  const { user: contextUser } = useOutletContext() || {};
  const [user, setUser] = useState(contextUser);
  const navigate = useNavigate();
  const location = useLocation();
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  // Завантажуємо користувача, якщо не передано через context
  useEffect(() => {
    if (!user) {
      authService.getCurrentUser().then(setUser).catch(console.error);
    }
  }, [user]);

  // Перевіряємо, чи потрібно відкрити діалог при поверненні зі сторінки підтвердження
  useEffect(() => {
    // Перевіряємо тільки якщо є openDialog і це саме наша секція, і діалог ще не відкритий
    if (location.state?.openDialog && location.state?.section?.id === section.id && !bookingDialogOpen) {
      setBookingDialogOpen(true);
      // Очищаємо state, щоб не відкривати діалог при наступних навігаціях
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.openDialog, location.state?.section?.id, section.id, navigate, location.pathname, bookingDialogOpen]);

  const getSportIcon = (sportType) => {
    switch (sportType) {
      case 'fitness':
        return <FitnessCenter />;
      case 'swimming':
        return <Pool />;
      case 'yoga':
        return <SelfImprovement />;
      default:
        return <FitnessCenter />;
    }
  };

  const getSportLabel = (sportType) => {
    const labels = {
      fitness: 'Фітнес',
      swimming: 'Плавання',
      yoga: 'Йога',
    };
    return labels[sportType] || sportType;
  };

  const getLevelLabel = (level) => {
    const labels = {
      beginner: 'Початковий',
      intermediate: 'Середній',
      advanced: 'Просунутий',
    };
    return labels[level] || level;
  };

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
          {getSportIcon(section.sport_type)}
        </Box>
      </CardMedia>

      <CardContent sx={{ flexGrow: 1, backgroundColor: '#FAF0E6' }}>
        <Typography 
          variant="h6" 
          component="h2" 
          gutterBottom
          sx={{ 
            color: 'text.primary',
          }}
        >
          {getSportLabel(section.sport_type)}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center'}}>
          <Chip
            label={getLevelLabel(section.preparation_level)}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ mb: 1 }}
          />
          {section.trainer_name && (
            <Chip
              icon={<PersonIcon />}
              label={section.trainer_name}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ mb: 1 }}
            />
          )}
        </Box>

        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.secondary',
            mb: 1,
          }} 
          gutterBottom
        >
          Зал: {section.hall_name || section.hall_room_number || 'Не вказано'}
        </Typography>

        {(() => {
          // Форматування вікового діапазону
          const minAge = section.min_age;
          const maxAge = section.max_age;
          
          if (minAge !== null && minAge !== undefined && maxAge !== null && maxAge !== undefined) {
            // Обидва значення є - показуємо діапазон
            return (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  mb: 1,
                }} 
                gutterBottom
              >
                Вік: {minAge} - {maxAge} років
              </Typography>
            );
          } else if (minAge !== null && minAge !== undefined) {
            // Тільки мінімальний вік - показуємо "від X років"
            return (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  mb: 1,
                }} 
                gutterBottom
              >
                Вік: від {minAge} років
              </Typography>
            );
          } else if (maxAge !== null && maxAge !== undefined) {
            // Тільки максимальний вік - показуємо "до X років"
            return (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  mb: 1,
                }} 
                gutterBottom
              >
                Вік: до {maxAge} років
              </Typography>
            );
          }
          // Якщо немає жодного значення - не показуємо вік
          return null;
        })()}

        <Box sx={{ mt: 2, mb: 1 }}>
          {(() => {
            // Перевіряємо, чи є знижка для Premium картки на плавання
            const hasDiscount = user?.card?.type === 'premium' && section.sport_type === 'swimming' && section.has_discount;
            const originalPrice = section.original_price || section.price;
            const discountedPrice = section.discounted_price;
            
            if (hasDiscount && discountedPrice) {
              return (
                <Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: 'text.secondary',
                      textDecoration: 'line-through',
                      mb: 0.5,
                    }}
                  >
                    {originalPrice} ₴
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: 'accent.main',
                      fontWeight: 600,
                    }}
                  >
                    {discountedPrice} ₴
                  </Typography>
                </Box>
              );
            }
            
            return (
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'accent.main',
                  fontWeight: 600,
                }}
              >
                {originalPrice} ₴
              </Typography>
            );
          })()}
        </Box>

        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.secondary',
          }}
        >
          Вільних місць: {section.available_seats || section.seats_limit}
        </Typography>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleViewDetails}
          sx={{ color: '#FAF0E6' }}
        >
          Переглянути розклад
        </Button>
      </CardActions>

      <BookingDialog
        open={bookingDialogOpen}
        onClose={() => setBookingDialogOpen(false)}
        section={section}
      />
    </Card>
  );
};

export default SectionCard;

