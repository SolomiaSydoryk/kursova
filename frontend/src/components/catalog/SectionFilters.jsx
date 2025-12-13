import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from '@mui/material';

const SectionFilters = ({ filters, onChange }) => {
  const handleChange = (field, value) => {
    onChange({
      ...filters,
      [field]: value,
    });
  };

  const ageCategories = [
    { value: 'kids', label: 'Діти (4-12 років)', min: 4, max: 12 },
    { value: 'teens', label: 'Підлітки (12-18 років)', min: 12, max: 18 },
    { value: 'adults', label: 'Дорослі (19-35 років)', min: 19, max: 35 },
    { value: 'adults_36_50', label: 'Дорослі (36-50 років)', min: 36, max: 50 },
    { value: 'seniors', label: '50+ років', min: 50, max: 100 },
  ];

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        backgroundColor: 'secondary.light', 
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <FormControl sx={{ minWidth: 160 }} size="small">
          <InputLabel id="sport-type-label" sx={{ fontSize: '0.875rem' }}>
            Вид спорту
          </InputLabel>
          <Select
            labelId="sport-type-label"
            value={filters.sport_type || ''}
            label="Вид спорту"
            onChange={(e) => handleChange('sport_type', e.target.value)}
            sx={{
              backgroundColor: '#FAF0E6',
              fontSize: '0.875rem',
            }}
          >
            <MenuItem value="" sx={{ fontSize: '0.875rem' }}>
              Всі види спорту
            </MenuItem>
            <MenuItem value="fitness" sx={{ fontSize: '0.875rem' }}>
              Фітнес
            </MenuItem>
            <MenuItem value="swimming" sx={{ fontSize: '0.875rem' }}>
              Плавання
            </MenuItem>
            <MenuItem value="yoga" sx={{ fontSize: '0.875rem' }}>
              Йога
            </MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 180 }} size="small">
          <InputLabel id="level-label" sx={{ fontSize: '0.875rem' }}>
            Рівень підготовки
          </InputLabel>
          <Select
            labelId="level-label"
            value={filters.preparation_level || ''}
            label="Рівень підготовки"
            onChange={(e) => handleChange('preparation_level', e.target.value)}
            sx={{
              backgroundColor: '#FAF0E6', 
              fontSize: '0.875rem',
            }}
          >
            <MenuItem value="" sx={{ fontSize: '0.875rem' }}>
              Всі рівні
            </MenuItem>
            <MenuItem value="beginner" sx={{ fontSize: '0.875rem' }}>
              Початковий
            </MenuItem>
            <MenuItem value="intermediate" sx={{ fontSize: '0.875rem' }}>
              Середній
            </MenuItem>
            <MenuItem value="advanced" sx={{ fontSize: '0.875rem' }}>
              Просунутий
            </MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel id="age-category-label" sx={{ fontSize: '0.875rem' }}>
            Вікова категорія
          </InputLabel>
          <Select
            labelId="age-category-label"
            value={filters.age_category || ''}
            label="Вікова категорія"
            onChange={(e) => handleChange('age_category', e.target.value)}
            sx={{
              backgroundColor: '#FAF0E6', 
              fontSize: '0.875rem',
            }}
          >
            <MenuItem value="" sx={{ fontSize: '0.875rem' }}>
              Всі вікові категорії
            </MenuItem>
            {ageCategories.map((category) => (
              <MenuItem key={category.value} value={category.value} sx={{ fontSize: '0.875rem' }}>
                {category.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );
};

export default SectionFilters;

