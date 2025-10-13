import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase/firebase';

// Import Pages and Components
import DermaScanHome from './pages/DermaScanHome';
import ProfilePage from './pages/ProfilePage';
import ScanHistoryPage from './pages/ScanHistoryPage';
import LibraryPage from './pages/LibraryPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Navbar from './components/Navbar';
import { Box, CircularProgress } from '@mui/material';

// --- Black Dashboard Theme ---
let lightTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { 
      main: '#34495e',
      light: '#5d6d7e',
      dark: '#2c3e50',
      contrastText: '#ffffff'
    },
    secondary: { 
      main: '#3498db',
      light: '#5dade2',
      dark: '#2980b9'
    },
    background: { 
      default: '#1e1e2f', 
      paper: '#27293d' 
    },
    text: {
      primary: '#ffffff',
      secondary: '#adb5bd'
    },
    error: {
      main: '#e74c3c',
      light: '#ec7063',
      dark: '#c0392b'
    },
    warning: {
      main: '#ffa726',
      light: '#ffb74d',
      dark: '#f57c00'
    },
    success: {
      main: '#00d4aa',
      light: '#33dbb8',
      dark: '#009473'
    },
    info: {
      main: '#17a2b8',
      light: '#48c6d4',
      dark: '#138496'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, fontSize: '3.5rem' },
    h2: { fontWeight: 700, fontSize: '2.5rem' },
    h3: { fontWeight: 700, fontSize: '2rem' },
    h4: { fontWeight: 600, fontSize: '1.5rem' },
    h5: { fontWeight: 600, fontSize: '1.25rem' },
    h6: { fontWeight: 600, fontSize: '1rem' },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 }
  },
  shape: {
    borderRadius: 12
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.1)',
    '0px 4px 8px rgba(0,0,0,0.12)',
    '0px 8px 16px rgba(0,0,0,0.14)',
    '0px 12px 24px rgba(0,0,0,0.16)',
    '0px 16px 32px rgba(0,0,0,0.18)',
    '0px 20px 40px rgba(0,0,0,0.20)',
    '0px 24px 48px rgba(0,0,0,0.22)',
    '0px 28px 56px rgba(0,0,0,0.24)',
    '0px 32px 64px rgba(0,0,0,0.26)',
    '0px 36px 72px rgba(0,0,0,0.28)',
    '0px 40px 80px rgba(0,0,0,0.30)',
    '0px 44px 88px rgba(0,0,0,0.32)',
    '0px 48px 96px rgba(0,0,0,0.34)',
    '0px 52px 104px rgba(0,0,0,0.36)',
    '0px 56px 112px rgba(0,0,0,0.38)',
    '0px 60px 120px rgba(0,0,0,0.40)',
    '0px 64px 128px rgba(0,0,0,0.42)',
    '0px 68px 136px rgba(0,0,0,0.44)',
    '0px 72px 144px rgba(0,0,0,0.46)',
    '0px 76px 152px rgba(0,0,0,0.48)',
    '0px 80px 160px rgba(0,0,0,0.50)',
    '0px 84px 168px rgba(0,0,0,0.52)',
    '0px 88px 176px rgba(0,0,0,0.54)',
    '0px 92px 184px rgba(0,0,0,0.56)'
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 4,
          padding: '10px 20px',
          boxShadow: '0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          boxShadow: '0 7px 14px rgba(50, 50, 93, 0.1), 0 3px 6px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 20px 0 rgba(0, 0, 0, 0.1)'
        }
      }
    }
  }
});
lightTheme = responsiveFontSizes(lightTheme);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><CircularProgress /></Box>;
  }

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <Router>
        <Box sx={{ 
          backgroundColor: 'background.default', 
          minHeight: '100vh',
          backgroundImage: 'linear-gradient(135deg, #1e1e2f 0%, #2b2b3d 50%, #1e1e2f 100%)'
        }}>
          <Navbar user={user} onLogout={handleLogout} />
          <Box sx={{ 
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 20% 50%, rgba(52, 73, 94, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(52, 152, 219, 0.05) 0%, transparent 50%)',
              pointerEvents: 'none'
            }
          }}>
            <Routes>
              <Route path="/" element={<DermaScanHome />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
              <Route path="/history" element={user ? <ScanHistoryPage /> : <Navigate to="/login" />} />
              <Route path="/login" element={user ? <Navigate to="/history" /> : <LoginPage />} />
              <Route path="/signup" element={user ? <Navigate to="/history" /> : <SignupPage />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;

