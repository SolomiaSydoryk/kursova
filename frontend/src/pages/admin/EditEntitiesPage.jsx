import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  Edit as EditIcon,
} from '@mui/icons-material';
import { hallService } from '../../services/hallService';
import { sectionService } from '../../services/sectionService';

const EditEntitiesPage = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [halls, setHalls] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tabValue === 0) {
        const hallsData = await hallService.getAll();
        setHalls(hallsData);
      } else {
        const sectionsData = await sectionService.getAll();
        setSections(sectionsData);
      }
    } catch (err) {
      setError('Помилка завантаження даних');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tabValue]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEdit = (id, type) => {
    if (type === 'hall') {
      navigate(`/admin/halls/${id}/edit`);
    } else {
      navigate(`/admin/sections/${id}/edit`);
    }
  };


  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/admin/dashboard')}
        sx={{ mb: 3, color: '#FAF0E6' }}
      >
        Назад до панелі
      </Button>

      <Paper sx={{ backgroundColor: '#FAF0E6' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                color: '#1F5A4D',
                '&.Mui-selected': {
                  color: '#1F5A4D',
                  fontWeight: 600,
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#1F5A4D',
              },
            }}
          >
            <Tab label="Зали" />
            <Tab label="Секції" />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, mx: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {tabValue === 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#1F5A4D' }}>
                      <TableCell sx={{ color: '#FAF0E6', fontWeight: 600 }}>ID</TableCell>
                      <TableCell sx={{ color: '#FAF0E6', fontWeight: 600 }}>Назва</TableCell>
                      <TableCell sx={{ color: '#FAF0E6', fontWeight: 600 }}>Номер залу</TableCell>
                      <TableCell sx={{ color: '#FAF0E6', fontWeight: 600 }}>Вид спорту</TableCell>
                      <TableCell sx={{ color: '#FAF0E6', fontWeight: 600 }}>Місткість</TableCell>
                      <TableCell sx={{ color: '#FAF0E6', fontWeight: 600 }}>Ціна</TableCell>
                      <TableCell sx={{ color: '#FAF0E6', fontWeight: 600 }}>Дії</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {halls.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                            Немає залів
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      halls.map((hall) => (
                        <TableRow key={hall.id} hover>
                          <TableCell>#{hall.id}</TableCell>
                          <TableCell>{hall.name}</TableCell>
                          <TableCell>{hall.room_number || '-'}</TableCell>
                          <TableCell>
                            {hall.event_type ? (() => {
                              const labels = {
                                fitness: 'Фітнес',
                                swimming: 'Плавання',
                                pilates: 'Пілатес',
                                volleyball: 'Волейбол',
                                tennis: 'Теніс',
                                yoga: 'Йога',
                              };
                              return labels[hall.event_type] || hall.event_type;
                            })() : '-'}
                          </TableCell>
                          <TableCell>{hall.capacity}</TableCell>
                          <TableCell>{hall.price} ₴</TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(hall.id, 'hall')}
                              sx={{ color: '#1F5A4D' }}
                            >
                              <EditIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#1F5A4D' }}>
                      <TableCell sx={{ color: '#FAF0E6', fontWeight: 600 }}>ID</TableCell>
                      <TableCell sx={{ color: '#FAF0E6', fontWeight: 600 }}>Зал</TableCell>
                      <TableCell sx={{ color: '#FAF0E6', fontWeight: 600 }}>Вид спорту</TableCell>
                      <TableCell sx={{ color: '#FAF0E6', fontWeight: 600 }}>Рівень</TableCell>
                      <TableCell sx={{ color: '#FAF0E6', fontWeight: 600 }}>Тренер</TableCell>
                      <TableCell sx={{ color: '#FAF0E6', fontWeight: 600 }}>Ціна</TableCell>
                      <TableCell sx={{ color: '#FAF0E6', fontWeight: 600 }}>Місць</TableCell>
                      <TableCell sx={{ color: '#FAF0E6', fontWeight: 600 }}>Дії</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sections.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                            Немає секцій
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      sections.map((section) => (
                        <TableRow key={section.id} hover>
                          <TableCell>#{section.id}</TableCell>
                          <TableCell>{section.hall_name || section.hall?.name || '-'}</TableCell>
                          <TableCell>
                            {section.sport_type === 'fitness' ? 'Фітнес' :
                             section.sport_type === 'swimming' ? 'Плавання' :
                             section.sport_type === 'pilates' ? 'Пілатес' :
                             section.sport_type === 'volleyball' ? 'Волейбол' :
                             section.sport_type === 'tennis' ? 'Теніс' :
                             section.sport_type === 'yoga' ? 'Йога' : section.sport_type}
                          </TableCell>
                          <TableCell>
                            {section.preparation_level === 'beginner' ? 'Початковий' :
                             section.preparation_level === 'intermediate' ? 'Середній' :
                             section.preparation_level === 'advanced' ? 'Просунутий' : section.preparation_level}
                          </TableCell>
                          <TableCell>
                            {section.trainer_name || (section.trainer
                              ? `${section.trainer.first_name} ${section.trainer.last_name}`
                              : 'Не призначено')}
                          </TableCell>
                          <TableCell>{section.price} ₴</TableCell>
                          <TableCell>{section.seats_limit}</TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(section.id, 'section')}
                              sx={{ color: '#1F5A4D' }}
                            >
                              <EditIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default EditEntitiesPage;

