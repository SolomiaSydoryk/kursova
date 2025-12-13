import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Container,
  CircularProgress,
  Alert,
} from '@mui/material';
import SectionCard from './SectionCard';
import HallCard from './HallCard';
import SectionFilters from './SectionFilters';
import HallFilters from './HallFilters';
import { sectionService } from '../../services/sectionService';
import { hallService } from '../../services/hallService';

const Catalog = () => {
  const [activeTab, setActiveTab] = useState(0); // 0 = Секції, 1 = Зали
  const [sections, setSections] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Фільтри для секцій
  const [sectionFilters, setSectionFilters] = useState({
    sport_type: '',
    preparation_level: '',
    age_category: '',
  });

  // Фільтри для залів
  const [hallFilters, setHallFilters] = useState({
    event_type: '',
    capacity: '',
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, sectionFilters, hallFilters]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 0) {
        // Завантажуємо секції
        const data = await sectionService.getAll(sectionFilters);
        setSections(data);
      } else {
        // Завантажуємо зали
        const data = await hallService.getAll(hallFilters);
        setHalls(data);
      }
    } catch (err) {
      setError('Помилка завантаження даних');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSectionFilterChange = (newFilters) => {
    setSectionFilters(newFilters);
  };

  const handleHallFilterChange = (newFilters) => {
    setHallFilters(newFilters);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #111A19 0%, #111A19 35%, #BB6830 65%, #BB6830 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              borderBottom: 2,
              borderColor: '#BB6830',
              mb: 2,
              '& .MuiTab-root': {
                fontSize: '1.25rem',
                fontWeight: 600,
                textTransform: 'none',
                minHeight: 56,
                color: '#BB6830',
                '&.Mui-selected': {
                  color: '#BB6830', 
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                backgroundColor: '#BB6830', // для індикатора
              },
            }}
          >
            <Tab label="Секції" />
            <Tab label="Зали" />
          </Tabs>
        </Box>

      {activeTab === 0 && (
        <SectionFilters
          filters={sectionFilters}
          onChange={handleSectionFilterChange}
        />
      )}

      {activeTab === 1 && (
        <HallFilters
          filters={hallFilters}
          onChange={handleHallFilterChange}
        />
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 4,
            width: '100%',
          }}
        >
          {activeTab === 0
            ? sections.map((section) => (
                <SectionCard key={section.id} section={section} />
              ))
            : halls.map((hall) => (
                <HallCard key={hall.id} hall={hall} />
              ))}
        </Box>
      )}

      {!loading && activeTab === 0 && sections.length === 0 && (
        <Alert 
          severity="info" 
          sx={{ 
            mt: 2,
            backgroundColor: '#F5E6D3', // creasedKhaki
            color: 'text.primary',
            '& .MuiAlert-icon': {
              color: 'text.primary',
            },
          }}
        >
          Секції не знайдено за вказаними фільтрами
        </Alert>
      )}

      {!loading && activeTab === 1 && halls.length === 0 && (
        <Alert 
          severity="info" 
          sx={{ 
            mt: 2,
            backgroundColor: '#F5E6D3', 
            color: 'text.primary',
            '& .MuiAlert-icon': {
              color: 'text.primary',
            },
          }}
        >
          Зали не знайдено за вказаними фільтрами
        </Alert>
      )}
      </Container>
    </Box>
  );
};

export default Catalog;

