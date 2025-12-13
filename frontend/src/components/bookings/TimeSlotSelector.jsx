import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Chip,
} from '@mui/material';
import { CalendarToday, AccessTime } from '@mui/icons-material';

const TimeSlotSelector = ({ timeslots, selectedTimeslot, onSelect }) => {
  const [selectedDate, setSelectedDate] = useState(null);

  // Групуємо timeslots по датах
  const groupedByDate = timeslots.reduce((acc, slot) => {
    const date = slot.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(slot);
    return acc;
  }, {});

  const dates = Object.keys(groupedByDate).sort();

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (timeslot) => {
    onSelect(timeslot);
  };

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Доступні дати та час
      </Typography>

      {dates.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Немає доступних слотів
        </Typography>
      ) : (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom sx={{ mb: 1 }}>
              <CalendarToday sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              Виберіть дату:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {dates.map((date) => (
                <Chip
                  key={date}
                  label={new Date(date).toLocaleDateString('uk-UA', {
                    day: 'numeric',
                    month: 'long',
                  })}
                  onClick={() => handleDateSelect(date)}
                  color={selectedDate === date ? 'primary' : 'default'}
                  variant={selectedDate === date ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>

          {selectedDate && groupedByDate[selectedDate] && (
            <Box>
              <Typography variant="body2" gutterBottom sx={{ mb: 1 }}>
                <AccessTime sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                Виберіть час:
              </Typography>
              <Grid container spacing={1}>
                {groupedByDate[selectedDate].map((slot) => (
                  <Grid item xs={6} sm={4} key={slot.id}>
                    <Button
                      fullWidth
                      variant={
                        selectedTimeslot?.id === slot.id ? 'contained' : 'outlined'
                      }
                      onClick={() => handleTimeSelect(slot)}
                      sx={{ minHeight: 48 }}
                    >
                      {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                      {slot.available_seats && (
                        <Typography variant="caption" display="block">
                          {slot.available_seats} місць
                        </Typography>
                      )}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default TimeSlotSelector;

