import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase/firebase';

// Import Pages and Components
import DermaScanHome from './pages/DermaScanHome';
import ProfilePage from './pages/ProfilePage';
import ScanHistoryPage from './pages/ScanHistoryPage';
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
  shadows: Array(25).fill('none'),
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
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, now fetch their profile from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserProfile({ uid: user.uid, ...userDoc.data() });
        } else {
          // Handle case where user exists in Auth but not Firestore
          setUserProfile(user); // Fallback to auth user object
        }
      } else {
        // User is signed out
        setUserProfile(null);
      }
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
          <Navbar user={userProfile} onLogout={handleLogout} />
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
              <Route path="/" element={<DermaScanHome userProfile={userProfile} />} />
              <Route path="/profile" element={userProfile ? <ProfilePage /> : <Navigate to="/login" />} />
              <Route path="/history" element={userProfile ? <ScanHistoryPage userProfile={userProfile} /> : <Navigate to="/login" />} />
              <Route path="/login" element={userProfile ? <Navigate to="/history" /> : <LoginPage />} />
              <Route path="/signup" element={userProfile ? <Navigate to="/history" /> : <SignupPage />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
