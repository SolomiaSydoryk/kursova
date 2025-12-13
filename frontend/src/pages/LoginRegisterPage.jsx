import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const LoginRegisterPage = () => {
  const [activeTab, setActiveTab] = useState(0); // 0 = Вхід, 1 = Реєстрація
  const navigate = useNavigate();

  // Стан для входу
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Стан для реєстрації
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerFirstName, setRegisterFirstName] = useState('');
  const [registerLastName, setRegisterLastName] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Очищаємо помилки при перемиканні вкладок
    setLoginError('');
    setRegisterError('');
    setRegisterSuccess(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const { user } = await authService.login(loginEmail, loginPassword);
      
      // Визначаємо роль та перенаправляємо
      if (user.is_staff) {
        navigate('/admin/dashboard');
      } else {
        navigate('/client/catalog');
      }
    } catch (err) {
      setLoginError(err.message || 'Помилка входу. Перевірте дані.');
      console.error('Login error:', err);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess(false);
    setRegisterLoading(true);

    try {
      const { user } = await authService.register(
        registerEmail,
        registerFirstName,
        registerLastName,
        registerPassword || undefined // Якщо пароль порожній, не передаємо його
      );
      
      setRegisterSuccess(true);
      
      // Автоматично перенаправляємо після успішної реєстрації
      setTimeout(() => {
        if (user.is_staff) {
          navigate('/admin/dashboard');
        } else {
          navigate('/client/catalog');
        }
      }, 1500);
    } catch (err) {
      setRegisterError(err.message || 'Помилка реєстрації. Перевірте дані.');
      console.error('Register error:', err);
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #111A19 0%, #111A19 35%, #BB6830 65%, #BB6830 100%)',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          width: '100%',
          maxWidth: 450,
          backgroundColor: '#FAF0E6', 
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 3 }}>
          Спортивний центр
        </Typography>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Вхід" />
          <Tab label="Реєстрація" />
        </Tabs>

        {/* Вкладка входу */}
        {activeTab === 0 && (
          <>
            {loginError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {loginError}
              </Alert>
            )}

            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Пошта"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                margin="normal"
                required
                autoComplete="email"
              />
              <TextField
                fullWidth
                label="Пароль"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                margin="normal"
                required
                autoComplete="current-password"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2,}}
                disabled={loginLoading}
              >
                {loginLoading ? 'Вхід...' : 'Увійти'}
              </Button>
            </form>
          </>
        )}

        {/* Вкладка реєстрації */}
        {activeTab === 1 && (
          <>
            {registerError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {registerError}
              </Alert>
            )}

            {registerSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Реєстрація успішна! Перенаправляємо...
              </Alert>
            )}

            <form onSubmit={handleRegister}>
              <TextField
                fullWidth
                label="Пошта"
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                margin="normal"
                required
                autoComplete="email"
              />
              <TextField
                fullWidth
                label="Ім'я"
                value={registerFirstName}
                onChange={(e) => setRegisterFirstName(e.target.value)}
                margin="normal"
                required
                autoComplete="given-name"
              />
              <TextField
                fullWidth
                label="Прізвище"
                value={registerLastName}
                onChange={(e) => setRegisterLastName(e.target.value)}
                margin="normal"
                required
                autoComplete="family-name"
              />
              <TextField
                fullWidth
                label="Пароль (опційно)"
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                margin="normal"
                helperText="Якщо не вказати, пароль буде згенеровано автоматично"
                autoComplete="new-password"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{mt: 3, mb: 2,}}
                disabled={registerLoading || registerSuccess}
              >
                {registerLoading ? 'Реєстрація...' : 'Зареєструватися'}
              </Button>
            </form>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default LoginRegisterPage;

