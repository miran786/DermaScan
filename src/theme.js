import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  palette: {
    primary: {
      main: '#009688', // Teal
      light: '#33ab9f',
      dark: '#00695f',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2196f3', // Blue
      light: '#4dabf5',
      dark: '#1769aa',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f4f6f8', // Light Grey for background
      paper: '#ffffff',
    },
    text: {
      primary: '#263238', // Dark Blue Grey
      secondary: '#546e7a',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none', // No uppercase buttons
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12, // More rounded corners
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)',
          },
        },
        containedPrimary: {
            background: 'linear-gradient(45deg, #009688 30%, #2196f3 90%)',
        }
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiPaper: {
        styleOverrides: {
            elevation1: {
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
            }
        }
    },
    MuiTextField: {
        styleOverrides: {
            root: {
                '& .MuiOutlinedInput-root': {
                    borderRadius: 8,
                }
            }
        }
    }
  },
});

theme = responsiveFontSizes(theme);

export default theme;
