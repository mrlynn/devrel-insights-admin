'use client';

import { createTheme } from '@mui/material/styles';

// MongoDB Brand Colors
export const mongoColors = {
  green: '#00ED64',
  darkGreen: '#00684A',
  black: '#001E2B',
  white: '#FFFFFF',
  gray: {
    100: '#F9FBFA',
    200: '#E8EDEB',
    300: '#C1C7C6',
    400: '#889397',
    500: '#5C6C75',
    600: '#3D4F58',
    700: '#1C2D38',
  },
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: mongoColors.green,
      dark: mongoColors.darkGreen,
      contrastText: mongoColors.black,
    },
    secondary: {
      main: mongoColors.black,
      contrastText: mongoColors.white,
    },
    background: {
      default: mongoColors.gray[100],
      paper: mongoColors.white,
    },
    text: {
      primary: mongoColors.black,
      secondary: mongoColors.gray[600],
    },
    divider: mongoColors.gray[200],
    error: {
      main: '#DB3030',
    },
    warning: {
      main: '#FFC010',
    },
    info: {
      main: '#016BF8',
    },
    success: {
      main: mongoColors.green,
    },
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.1rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 0 rgba(0,0,0,0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: mongoColors.gray[100],
        },
      },
    },
  },
});

export default theme;
