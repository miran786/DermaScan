import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase/firebase';
import { PatientProvider } from './context/PatientContext'; // Import the provider

// Import Pages and Components
import ProfilePage from './pages/ProfilePage';
import ScanHistoryPage from './pages/ScanHistoryPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Navbar from './components/Navbar';
import DoctorDashboard from './pages/DoctorDashboard';
import UploadPage from './pages/UploadPage';
import { Box, CircularProgress } from '@mui/material';

import theme from './theme';

function App() {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserProfile({ uid: user.uid, ...userDoc.data() });
        } else {
          setUserProfile(user);
        }
      } else {
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
    return <Box display="flex" justifyContent="center" alignItems="center" height="100vh" bgcolor="background.default"><CircularProgress /></Box>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <PatientProvider> {/* Wrap the components with PatientProvider */}
          <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
            <Navbar user={userProfile} onLogout={handleLogout} />
            <Box>
              <Routes>
                {/* Default route redirects to dashboard if logged in, otherwise to login */}
                <Route path="/" element={userProfile ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />

                <Route path="/dashboard" element={userProfile?.role === 'doctor' ? <DoctorDashboard /> : <Navigate to="/history" />} />
                <Route path="/upload" element={userProfile ? <UploadPage /> : <Navigate to="/login" />} />
                <Route path="/profile" element={userProfile ? <ProfilePage /> : <Navigate to="/login" />} />
                <Route path="/history" element={userProfile ? <ScanHistoryPage userProfile={userProfile} /> : <Navigate to="/login" />} />

                <Route path="/login" element={userProfile ? <Navigate to="/dashboard" /> : <LoginPage />} />
                <Route path="/signup" element={userProfile ? <Navigate to="/dashboard" /> : <SignupPage />} />
              </Routes>
            </Box>
          </Box>
        </PatientProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
