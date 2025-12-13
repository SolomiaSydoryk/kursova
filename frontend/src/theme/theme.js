import { createTheme } from '@mui/material/styles';
import { palette } from './colors';

const theme = createTheme({
  palette,
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      color: palette.text.primary,
    },
    h2: {
      color: palette.text.primary,
    },
    h3: {
      color: palette.text.primary,
    },
    body1: {
      color: palette.text.primary,
    },
    body2: {
      color: palette.text.secondary,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
        },
        contained: {
          backgroundColor: palette.primary.main,
          color: palette.primary.contrastText,
          '&:hover': {
            backgroundColor: '#153D33', 
          },
        },
        outlined: {
          borderColor: palette.primary.main,
          color: palette.primary.main,
          '&:hover': {
            backgroundColor: palette.primary.light,
            borderColor: palette.primary.dark,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#FAF0E6',
          border: `1px solid ${palette.secondary.light}`,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          backgroundColor: '#FAF0E6', // lightKhaki для однорідного фону спадних меню
          '&:hover': {
            backgroundColor: '#F5E6D3', // creasedKhaki для hover
          },
          '&.Mui-selected': {
            backgroundColor: '#F5E6D3', // creasedKhaki для вибраного
            '&:hover': {
              backgroundColor: '#F5E6D3',
            },
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FAF0E6', 
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 0, 0, 0.23)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          '&.MuiMenu-paper': {
            backgroundColor: '#FAF0E6', // lightKhaki для спадних меню Select
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${palette.secondary.light}`,
        },
        indicator: {
          backgroundColor: palette.primary.main,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          '&.Mui-selected': {
            color: palette.primary.main,
          },
        },
      },
    },
  },
});

export default theme;