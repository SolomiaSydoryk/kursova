import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
} from '@mui/material';
import {
  MeetingRoom,
  FitnessCenter,
  Assignment,
  Dashboard as DashboardIcon,
  Edit,
} from '@mui/icons-material';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Створити зал',
      description: 'Додати новий зал до системи',
      icon: <MeetingRoom sx={{ fontSize: 48 }} />,
      path: '/admin/halls/create',
      color: '#1F5A4D',
    },
    {
      title: 'Створити секцію',
      description: 'Додати нову секцію до залу',
      icon: <FitnessCenter sx={{ fontSize: 48 }} />,
      path: '/admin/sections/create',
      color: '#6B8A6B',
    },
    {
      title: 'Управління бронюваннями',
      description: 'Підтвердження та відхилення бронювань залів',
      icon: <Assignment sx={{ fontSize: 48 }} />,
      path: '/admin/reservations',
      color: '#BB6830',
    },
    {
      title: 'Редагування залів та секцій',
      description: 'Перегляд та редагування існуючих залів та секцій',
      icon: <Edit sx={{ fontSize: 48 }} />,
      path: '/admin/edit',
      color: '#335233',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: '#FAF0E6', mb: 1, fontWeight: 600 }}>
          <DashboardIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Панель адміністратора
        </Typography>
        <Typography variant="body1" sx={{ color: '#FAF0E6', opacity: 0.8 }}>
          Управління залами, секціями та бронюваннями
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {menuItems.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#FAF0E6',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 4 }}>
                <Box sx={{ color: item.color, mb: 2 }}>
                  {item.icon}
                </Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate(item.path)}
                  sx={{
                    backgroundColor: item.color,
                    color: '#FAF0E6',
                    '&:hover': {
                      backgroundColor: item.color,
                      opacity: 0.9,
                    },
                  }}
                >
                  Відкрити
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default AdminDashboard;

