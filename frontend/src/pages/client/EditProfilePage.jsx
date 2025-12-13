import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Avatar,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import { ArrowBack, PhotoCamera } from '@mui/icons-material';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { authService } from '../../services/authService';

const EditProfilePage = () => {
  const { user: contextUser, setUser: setContextUser } = useOutletContext() || {};
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    age: '',
    photo: null,
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoKey, setPhotoKey] = useState(0); // Для примусового оновлення Avatar

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await authService.getCurrentUser();
      if (userData) {
        setUser(userData);
        setFormData({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          age: userData.age || '',
          photo: null,
        });
        if (userData.photo) {
          // Якщо фото вже є, встановлюємо його як preview з timestamp для оновлення кешу
          const photoUrl = userData.photo.includes('?') 
            ? userData.photo.split('?')[0] + `?t=${Date.now()}`
            : `${userData.photo}?t=${Date.now()}`;
          setPhotoPreview(photoUrl);
          setPhotoKey(0); // Встановлюємо початковий key
        } else {
          setPhotoPreview(null);
          setPhotoKey(0);
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Помилка завантаження даних профілю');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Перевірка типу файлу
      if (!file.type.startsWith('image/')) {
        setError('Будь ласка, виберіть файл зображення');
        return;
      }
      // Перевірка розміру файлу (макс 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Розмір файлу не повинен перевищувати 5MB');
        return;
      }
      setFormData((prev) => ({
        ...prev,
        photo: file,
      }));
      // Створюємо preview
      const reader = new FileReader();
      reader.onloadend = () => {
        // Використовуємо FileReader result тільки для preview перед збереженням
        setPhotoPreview(reader.result);
        setPhotoKey(Date.now()); // Оновлюємо key для примусового оновлення
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('first_name', formData.first_name);
      formDataToSend.append('last_name', formData.last_name);
      formDataToSend.append('email', formData.email);
      if (formData.phone) {
        formDataToSend.append('phone', formData.phone);
      }
      if (formData.age) {
        formDataToSend.append('age', formData.age);
      }
      if (formData.photo) {
        // Відправляємо як photo_upload, щоб serializer міг його обробити
        formDataToSend.append('photo_upload', formData.photo);
      }

      const updatedUser = await authService.updateProfile(formDataToSend);
      setSuccess(true);
      // Оновлюємо дані користувача з відповіді сервера
      if (updatedUser) {
        console.log('=== FRONTEND: Updated user from server ===');
        console.log('Full user object:', updatedUser);
        console.log('Photo URL from server:', updatedUser.photo);
        
        // Очищаємо попередній preview 
        setPhotoPreview(null);
        const newKey = Date.now();
        setPhotoKey(newKey);
        console.log('Cleared preview, set new key:', newKey);
        
        // Оновлюємо користувача в контексті для Header
        if (setContextUser) {
          setContextUser(updatedUser);
          console.log('Updated context user');
        }
        setUser(updatedUser);
        
        // Завжди використовуємо URL з сервера після збереження 
        if (updatedUser.photo) {
          // Використовуємо URL з сервера (він вже містить timestamp)
          const photoUrl = updatedUser.photo;
          console.log('Setting photo preview from server:', photoUrl);
          
          // Встановлюємо новий URL після невеликої затримки для гарантії оновлення
          setTimeout(() => {
            console.log('Setting photo preview after timeout:', photoUrl);
            setPhotoPreview(photoUrl);
            const finalKey = Date.now();
            setPhotoKey(finalKey); // Оновлюємо key ще раз для примусового оновлення
            console.log('Final key set:', finalKey);
          }, 200);
        } else {
          // Якщо фото було видалено
          console.log('No photo in response, clearing preview');
          setPhotoPreview(null);
          setPhotoKey(prev => prev + 1);
        }
      }
      // Оновлюємо дані користувача
      setTimeout(() => {
        navigate('/client/profile');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Помилка оновлення профілю');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton
            onClick={() => navigate('/client/profile')}
            sx={{ mr: 1, color: '#111A19' }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" sx={{ color: '#111A19' }}>
            Редагування профілю
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Профіль успішно оновлено!
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Фото профілю */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Avatar
              key={`avatar-${photoKey}`} // Додаємо key для примусового оновлення
              src={photoPreview || null}
              sx={{
                width: 120,
                height: 120,
                mb: 2,
                bgcolor: '#BB6830',
                color: '#FAF0E6',
              }}
            >
              {formData.first_name?.[0] || formData.email?.[0] || 'U'}
            </Avatar>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="photo-upload"
              type="file"
              onChange={handlePhotoChange}
            />
            <label htmlFor="photo-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<PhotoCamera />}
                sx={{
                  borderColor: '#111A19', 
                  color: '#111A19',
                  '&:hover': {
                    borderColor: '#000000',
                    color: '#000000',
                    backgroundColor: 'transparent',
                  },
                }}
              >
                Завантажити фото
              </Button>
            </label>
          </Box>

          {/* Контактна інформація */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Ім'я"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              required
              fullWidth
            />

            <TextField
              label="Прізвище"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              required
              fullWidth
            />

            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              fullWidth
            />

            <TextField
              label="Телефон"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              fullWidth
              placeholder="+380XXXXXXXXX"
            />

            <TextField
              label="Вік"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              fullWidth
              inputProps={{ 
                inputMode: 'numeric',
                pattern: '[0-9]*',
              }}
            />

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                sx={{
                  backgroundColor: '#1F5A4D', 
                  color: '#FAF0E6',
                  '&:hover': {
                    backgroundColor: '#153D33',
                  },
                }}
              >
                {saving ? <CircularProgress size={24} /> : 'Зберегти зміни'}
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/client/profile')}
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
            </Box>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default EditProfilePage;

