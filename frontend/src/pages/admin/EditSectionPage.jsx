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
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Delete as DeleteIcon,
  Add,
} from '@mui/icons-material';
import { sectionService } from '../../services/sectionService';
import { hallService } from '../../services/hallService';
import { trainerService } from '../../services/trainerService';
import { scheduleService } from '../../services/scheduleService';

const EditSectionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [halls, setHalls] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [addTimeslotDialog, setAddTimeslotDialog] = useState(false);
  const [timeslotForm, setTimeslotForm] = useState({
    date: '',
    start_time: '',
    end_time: '',
  });
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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [section, hallsData, trainersData] = await Promise.all([
        sectionService.getById(id),
        hallService.getAll(),
        trainerService.getAll(),
      ]);

      setHalls(hallsData);
      setTrainers(trainersData);

      setFormData({
        hall: section.hall?.id || section.hall || '',
        trainer: section.trainer?.id || section.trainer || '',
        sport_type: section.sport_type || 'fitness',
        preparation_level: section.preparation_level || 'beginner',
        min_age: section.min_age || '',
        max_age: section.max_age || '',
        price: section.price || '',
        seats_limit: section.seats_limit || '',
      });

      // Завантажуємо розклад секції
      const schedulesData = await scheduleService.getSectionSchedule(id);
      setSchedules(schedulesData);
    } catch (err) {
      setError('Помилка завантаження даних');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTimeslotFormChange = (e) => {
    const { name, value } = e.target;
    setTimeslotForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
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

      await sectionService.update(id, sectionData);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/admin/edit');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Помилка оновлення секції');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTimeslot = async () => {
    if (!timeslotForm.date || !timeslotForm.start_time || !timeslotForm.end_time) {
      setError('Заповніть всі поля для додавання розкладу');
      return;
    }

    try {
      // Парсимо дату безпосередньо з рядка YYYY-MM-DD, щоб уникнути проблем з часовими поясами
      const dateParts = timeslotForm.date.split('-');
      if (dateParts.length !== 3) {
        setError('Невірний формат дати');
        return;
      }
      const timeslotData = {
        day: parseInt(dateParts[2], 10),
        month: parseInt(dateParts[1], 10),
        year: parseInt(dateParts[0], 10),
        start_time: timeslotForm.start_time,
        end_time: timeslotForm.end_time,
      };

      await scheduleService.addTimeslot(id, timeslotData);
      setAddTimeslotDialog(false);
      setTimeslotForm({ date: '', start_time: '', end_time: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка додавання розкладу');
    }
  };

  const handleDeleteTimeslot = async (scheduleId) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цей розклад?')) {
      return;
    }

    try {
      await scheduleService.removeTimeslot(scheduleId);
      loadData();
    } catch (err) {
      setError('Помилка видалення розкладу');
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      // Парсимо дату безпосередньо з рядка YYYY-MM-DD, щоб уникнути проблем з часовими поясами
      if (typeof dateString === 'string' && dateString.includes('-')) {
        const dateOnly = dateString.split('T')[0]; // Видаляємо час, якщо є
        const dateParts = dateOnly.split('-');
        if (dateParts.length === 3 && dateParts[0].length === 4) {
          const year = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10);
          const day = parseInt(dateParts[2], 10);
          if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            return `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`;
          }
        }
      }
      // Якщо формат не YYYY-MM-DD, використовуємо стандартний парсинг
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:MM
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
          Редагувати секцію
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Секція успішно оновлена! Перенаправлення...
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

        <Divider sx={{ my: 4 }} />

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Розклад секції
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAddTimeslotDialog(true)}
              sx={{
                backgroundColor: '#1F5A4D',
                color: '#FAF0E6',
                '&:hover': {
                  backgroundColor: '#153D33',
                },
              }}
            >
              Додати розклад
            </Button>
          </Box>

          {schedules.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              Немає розкладу для цієї секції
            </Typography>
          ) : (
            <List>
              {schedules.map((schedule) => (
                <ListItem
                  key={schedule.id}
                  sx={{
                    backgroundColor: '#FAF6E6',
                    mb: 1,
                    borderRadius: 1,
                    border: '1px solid #E8D4B8',
                  }}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteTimeslot(schedule.id)}
                      sx={{ color: '#C62828' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={`${formatDate(schedule.timeslot_date)} ${formatTime(schedule.timeslot_start_time)}-${formatTime(schedule.timeslot_end_time)}`}
                    secondary={schedule.hall_name}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Paper>

      <Dialog open={addTimeslotDialog} onClose={() => setAddTimeslotDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Додати розклад</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Дата *"
            name="date"
            type="date"
            value={timeslotForm.date}
            onChange={handleTimeslotFormChange}
            required
            sx={{ mb: 2, mt: 2 }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Час початку *"
            name="start_time"
            type="time"
            value={timeslotForm.start_time}
            onChange={handleTimeslotFormChange}
            required
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 3600 }}
          />
          <TextField
            fullWidth
            label="Час закінчення *"
            name="end_time"
            type="time"
            value={timeslotForm.end_time}
            onChange={handleTimeslotFormChange}
            required
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 3600 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAddTimeslotDialog(false)}
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
            onClick={handleAddTimeslot}
            variant="contained"
            sx={{
              backgroundColor: '#1F5A4D',
              color: '#FAF0E6',
              '&:hover': {
                backgroundColor: '#153D33',
              },
            }}
          >
            Додати
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EditSectionPage;

