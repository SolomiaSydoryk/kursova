import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { hallService } from '../../services/hallService';

const EditHallPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    room_number: '',
    event_type: '',
    capacity: '',
    price: '',
    is_active: true,
  });

  const loadHall = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const hall = await hallService.getById(id);
      setFormData({
        name: hall.name || '',
        room_number: hall.room_number || '',
        event_type: hall.event_type || '',
        capacity: hall.capacity || '',
        price: hall.price || '',
        is_active: hall.is_active !== undefined ? hall.is_active : true,
      });
    } catch (err) {
      setError('Помилка завантаження залу');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadHall();
  }, [loadHall]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      if (!formData.name.trim()) {
        throw new Error('Назва залу обов\'язкова');
      }
      if (!formData.capacity || parseInt(formData.capacity) <= 0) {
        throw new Error('Місткість має бути більше 0');
      }
      if (!formData.price || parseFloat(formData.price) < 0) {
        throw new Error('Ціна не може бути від\'ємною');
      }

      const hallData = {
        name: formData.name.trim(),
        room_number: formData.room_number.trim() || '',
        event_type: formData.event_type.trim() || '',
        capacity: parseInt(formData.capacity),
        price: parseFloat(formData.price),
        is_active: formData.is_active,
      };

      await hallService.update(id, hallData);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/admin/edit');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Помилка оновлення залу');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
        onClick={() => navigate('/admin/edit')}
        sx={{ mb: 3, color: '#FAF0E6' }}
      >
        Назад до списку
      </Button>

      <Paper sx={{ p: 4, backgroundColor: '#FAF0E6' }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          Редагувати зал
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Зал успішно оновлено! Перенаправлення...
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Назва залу *"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Номер залу"
            name="room_number"
            value={formData.room_number}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Вид спорту</InputLabel>
            <Select
              name="event_type"
              value={formData.event_type}
              onChange={handleChange}
              label="Вид спорту"
            >
              <MenuItem value="fitness">Фітнес</MenuItem>
              <MenuItem value="swimming">Плавання</MenuItem>
              <MenuItem value="pilates">Пілатес</MenuItem>
              <MenuItem value="volleyball">Волейбол</MenuItem>
              <MenuItem value="tennis">Теніс</MenuItem>
              <MenuItem value="yoga">Йога</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Місткість *"
            name="capacity"
            type="number"
            value={formData.capacity}
            onChange={handleChange}
            required
            inputProps={{ min: 1 }}
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
            sx={{ mb: 3 }}
          />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/admin/edit')}
              disabled={saving}
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
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
              sx={{
                backgroundColor: '#1F5A4D',
                color: '#FAF0E6',
                '&:hover': {
                  backgroundColor: '#153D33',
                },
              }}
            >
              {saving ? 'Збереження...' : 'Зберегти зміни'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default EditHallPage;

