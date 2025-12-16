import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from '@mui/material';

const HallFilters = ({ filters, onChange }) => {
  const handleChange = (field, value) => {
    onChange({
      ...filters,
      [field]: value,
    });
  };

  const predefinedCapacities = [5, 10, 15, 20, 30, 50, 75, 100];

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
          <InputLabel id="event-type-label" sx={{ fontSize: '0.875rem' }}>
            Вид спорту
          </InputLabel>
          <Select
            labelId="event-type-label"
            value={filters.event_type || ''}
            label="Вид спорту"
            onChange={(e) => handleChange('event_type', e.target.value)}
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
            <MenuItem value="pilates" sx={{ fontSize: '0.875rem' }}>
              Пілатес
            </MenuItem>
            <MenuItem value="volleyball" sx={{ fontSize: '0.875rem' }}>
              Волейбол
            </MenuItem>
            <MenuItem value="tennis" sx={{ fontSize: '0.875rem' }}>
              Теніс
            </MenuItem>
            <MenuItem value="yoga" sx={{ fontSize: '0.875rem' }}>
              Йога
            </MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 160 }} size="small">
          <InputLabel id="capacity-label" sx={{ fontSize: '0.875rem' }}>
            Кількість місць
          </InputLabel>
          <Select
            labelId="capacity-label"
            value={filters.capacity || ''}
            label="Кількість місць"
            onChange={(e) => handleChange('capacity', e.target.value)}
            sx={{
              backgroundColor: '#FAF0E6',
              fontSize: '0.875rem',
            }}
          >
            <MenuItem value="" sx={{ fontSize: '0.875rem' }}>
              Будь-яка
            </MenuItem>
            {predefinedCapacities.map((cap) => (
              <MenuItem key={cap} value={cap} sx={{ fontSize: '0.875rem' }}>
                {cap} місць
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );
};

export default HallFilters;

