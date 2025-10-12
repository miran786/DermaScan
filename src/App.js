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
import { Box, Container, Typography, CircularProgress } from '@mui/material';

// --- Light Theme ---
let lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f4f6f8', paper: '#ffffff' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h2: { fontWeight: 700 }, h3: { fontWeight: 700 },
    h4: { fontWeight: 600 }, h5: { fontWeight: 600 }
  },
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
        <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
          <Navbar user={user} onLogout={handleLogout} />
          <Routes>
            <Route path="/" element={<DermaScanHome />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
            {/* FIX: Corrected the typo from "an element" to "element" */}
            <Route path="/history" element={user ? <ScanHistoryPage /> : <Navigate to="/login" />} />
            <Route path="/login" element={user ? <Navigate to="/history" /> : <LoginPage />} />
            <Route path="/signup" element={user ? <Navigate to="/history" /> : <SignupPage />} />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;

