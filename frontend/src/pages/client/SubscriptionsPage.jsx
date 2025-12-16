import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
} from '@mui/material';
import { ArrowBack, CreditCard } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { subscriptionService } from '../../services/subscriptionService';
import { colors } from '../../theme/colors';

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const data = await subscriptionService.getSubscriptions();
      setSubscriptions(data);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      'single': 'Разовий',
      'monthly': 'Місячний',
    };
    return labels[type] || type;
  };

  const handlePurchase = (subscription) => {
    setSelectedSubscription(subscription);
    setPurchaseDialogOpen(true);
    setPurchaseError(null);
  };

  const handlePurchaseConfirm = async () => {
    if (!selectedSubscription) return;
    
    setPurchasing(true);
    setPurchaseError(null);
    
    try {
      // Імітація оплати картою
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await subscriptionService.purchaseSubscription(selectedSubscription.id);
      setPurchaseDialogOpen(false);
      alert(`Абонемент "${getTypeLabel(selectedSubscription.type)}" успішно придбано!`);
      setSelectedSubscription(null);
      // Перенаправляємо на профіль для оновлення списку абонементів
      navigate('/client/profile');
    } catch (err) {
      console.error('Error purchasing subscription:', err);
      setPurchaseError(err.response?.data?.error || 'Помилка при придбанні абонемента');
    } finally {
      setPurchasing(false);
    }
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
          <IconButton
            onClick={() => navigate('/client/profile')}
            sx={{ mr: 1, color: '#111A19' }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" sx={{ color: '#111A19' }}>
            Управління абонементами
          </Typography>
        </Box>

        {subscriptions.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            Немає доступних абонементів
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {subscriptions.map((subscription) => (
              <Grid item xs={12} md={4} key={subscription.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: colors.lightKhaki,
                    border: `1px solid ${colors.lightEarth}`, 
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Назва абонемента */}
                    <Typography variant="h5" gutterBottom sx={{ color: '#111A19', mb: 1, fontWeight: 'bold' }}>
                      {getTypeLabel(subscription.type)}
                    </Typography>
                    
                    {/* Опис */}
                    <Typography variant="body2" sx={{ color: '#111A19', mb: 2, fontSize: '0.875rem' }}>
                      {subscription.type === 'single' ? 'Разове відвідування' : 
                       subscription.type === 'monthly' ? 'Місячний абонемент' : 
                       'Корпоративний абонемент'}
                    </Typography>

                    {/* Тривалість або використання */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {subscription.type === 'single' 
                        ? 'Одне використання'
                        : `Тривалість: ${subscription.duration_days} ${subscription.duration_days === 1 ? 'день' : 'днів'}`}
                    </Typography>

                    {/* Ціна */}
                    <Typography variant="h4" sx={{ color: '#BB6830', mb: 3, fontWeight: 'bold' }}>
                      {subscription.price} ₴
                    </Typography>

                    {/* Кнопка придбання */}
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => handlePurchase(subscription)}
                      sx={{
                        backgroundColor: '#1F5A4D',
                        color: '#FAF0E6',
                        mt: 'auto',
                        '&:hover': {
                          backgroundColor: '#153D33',
                        },
                      }}
                    >
                      Придбати
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Діалог оплати */}
      <Dialog open={purchaseDialogOpen} onClose={() => !purchasing && setPurchaseDialogOpen(false)}>
        <DialogTitle>Оплата абонемента</DialogTitle>
        <DialogContent>
          {selectedSubscription && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Абонемент: <strong>{getTypeLabel(selectedSubscription.type)}</strong>
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Ціна: <strong>{selectedSubscription.price} ₴</strong>
              </Typography>
              
              <FormControl component="fieldset" sx={{ mt: 2 }}>
                <FormLabel component="legend">Спосіб оплати</FormLabel>
                <RadioGroup value="card" name="payment_method">
                  <FormControlLabel 
                    value="card" 
                    control={<Radio />} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CreditCard sx={{ mr: 1 }} />
                        <Typography>Оплата картою</Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>

              {purchaseError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {purchaseError}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setPurchaseDialogOpen(false)} 
            disabled={purchasing}
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
            onClick={handlePurchaseConfirm} 
            variant="contained"
            disabled={purchasing}
            sx={{
              backgroundColor: '#1F5A4D',
              color: '#FAF0E6',
              '&:hover': {
                backgroundColor: '#153D33',
              },
            }}
          >
            {purchasing ? 'Обробка...' : 'Оплатити'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SubscriptionsPage;
