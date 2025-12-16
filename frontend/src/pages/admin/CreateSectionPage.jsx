import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { sectionService } from '../../services/sectionService';
import { hallService } from '../../services/hallService';
import { trainerService } from '../../services/trainerService';

const CreateSectionPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [halls, setHalls] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [formData, setFormData] = useState({
    hall: '',
    trainer: '',
    sport_type: 'fitness',
    preparation_level: 'beginner',
    min_age: '',
    max_age: '',
    price: '',
    seats_limit: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [hallsData, trainersData] = await Promise.all([
        hallService.getAll(),
        trainerService.getAll(),
      ]);
      setHalls(hallsData);
      setTrainers(trainersData);
    } catch (err) {
      setError('Помилка завантаження даних');
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Валідація
      if (!formData.hall) {
        throw new Error('Виберіть зал');
      }
      if (!formData.price || parseFloat(formData.price) < 0) {
        throw new Error('Ціна не може бути від\'ємною');
      }
      if (!formData.seats_limit || parseInt(formData.seats_limit) <= 0) {
        throw new Error('Кількість місць має бути більше 0');
      }

      const sectionData = {
        hall: parseInt(formData.hall),
        trainer: formData.trainer ? parseInt(formData.trainer) : null,
        sport_type: formData.sport_type,
        preparation_level: formData.preparation_level,
        min_age: formData.min_age ? parseInt(formData.min_age) : null,
        max_age: formData.max_age ? parseInt(formData.max_age) : null,
        price: parseFloat(formData.price),
        seats_limit: parseInt(formData.seats_limit),
      };

      await sectionService.create(sectionData);
      setSuccess(true);

      // Очищаємо форму
      setFormData({
        hall: '',
        trainer: '',
        sport_type: 'fitness',
        preparation_level: 'beginner',
        min_age: '',
        max_age: '',
        price: '',
        seats_limit: '',
      });

      // Перенаправляємо через 2 секунди
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Помилка створення секції');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/admin/dashboard')}
        sx={{ mb: 3, color: '#FAF0E6' }}
      >
        Назад до панелі
      </Button>

      <Paper sx={{ p: 4, backgroundColor: '#FAF0E6' }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          Створити нову секцію
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Секція успішно створена! Перенаправлення...
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <FormControl fullWidth sx={{ mb: 2 }} required>
            <InputLabel>Зал *</InputLabel>
            <Select
              name="hall"
              value={formData.hall}
              onChange={handleChange}
              label="Зал *"
            >
              {halls.map((hall) => (
                <MenuItem key={hall.id} value={hall.id}>
                  {hall.name}{hall.room_number ? ` №${hall.room_number}` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Тренер</InputLabel>
            <Select
              name="trainer"
              value={formData.trainer}
              onChange={handleChange}
              label="Тренер"
            >
              <MenuItem value="">Не призначено</MenuItem>
              {trainers.map((trainer) => (
                <MenuItem key={trainer.id} value={trainer.id}>
                  {trainer.first_name} {trainer.last_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }} required>
            <InputLabel>Вид спорту *</InputLabel>
            <Select
              name="sport_type"
              value={formData.sport_type}
              onChange={handleChange}
              label="Вид спорту *"
            >
              <MenuItem value="fitness">Фітнес</MenuItem>
              <MenuItem value="swimming">Плавання</MenuItem>
              <MenuItem value="pilates">Пілатес</MenuItem>
              <MenuItem value="volleyball">Волейбол</MenuItem>
              <MenuItem value="tennis">Теніс</MenuItem>
              <MenuItem value="yoga">Йога</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }} required>
            <InputLabel>Рівень підготовки *</InputLabel>
            <Select
              name="preparation_level"
              value={formData.preparation_level}
              onChange={handleChange}
              label="Рівень підготовки *"
            >
              <MenuItem value="beginner">Початковий</MenuItem>
              <MenuItem value="intermediate">Середній</MenuItem>
              <MenuItem value="advanced">Просунутий</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Мінімальний вік"
            name="min_age"
            type="number"
            value={formData.min_age}
            onChange={handleChange}
            inputProps={{ min: 0 }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Максимальний вік"
            name="max_age"
            type="number"
            value={formData.max_age}
            onChange={handleChange}
            inputProps={{ min: 0 }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Ціна (₴) *"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            required
            inputProps={{ min: 0, step: 0.01 }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Кількість місць *"
            name="seats_limit"
            type="number"
            value={formData.seats_limit}
            onChange={handleChange}
            required
            inputProps={{ min: 1 }}
            sx={{ mb: 3 }}
          />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/admin/dashboard')}
              disabled={loading}
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
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              sx={{
                backgroundColor: '#1F5A4D',
                color: '#FAF0E6',
                '&:hover': {
                  backgroundColor: '#153D33',
                },
              }}
            >
              {loading ? 'Створення...' : 'Створити секцію'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default CreateSectionPage;

