import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Paper,
  Grid,
  InputAdornment,
  IconButton,
  MenuItem
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Person, Badge } from '@mui/icons-material';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient'); // Default role
  const [displayName, setDisplayName] = useState(''); // Add display name
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store user role and additional info in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: role,
        displayName: displayName,
        createdAt: new Date(),
      });

      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  };

  return (
    <Box sx={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      py: 4
    }}>
      <Container maxWidth="md">
        <Grid container component={Paper} elevation={6} sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <Grid item xs={12} md={5} sx={{
            bgcolor: 'secondary.main',
            color: 'white',
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #2196f3 0%, #1565c0 100%)'
          }}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>Join Us!</Typography>
            <Typography variant="h6" align="center" sx={{ opacity: 0.9 }}>
              Create an account to start analyzing and tracking your skin health.
            </Typography>
          </Grid>
          <Grid item xs={12} md={7} sx={{ p: 4, bgcolor: 'background.paper' }}>
            <Box component="form" onSubmit={handleSignup} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ mb: 1, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="text.primary">Sign Up</Typography>
                <Typography variant="body2" color="text.secondary">Fill in the details to create your account</Typography>
              </Box>

              {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

              <TextField
                label="Full Name"
                fullWidth
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Email Address"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                select
                label="I am a..."
                value={role}
                onChange={(e) => setRole(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Badge color="action" />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="patient">Patient</MenuItem>
                <MenuItem value="doctor">Doctor</MenuItem>
              </TextField>

              <Button
                type="submit"
                variant="contained"
                color="secondary"
                size="large"
                fullWidth
                sx={{ py: 1.5, fontSize: '1.1rem', mt: 1 }}
              >
                Create Account
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: '#2196f3', textDecoration: 'none', fontWeight: 600 }}>
                    Login
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default SignupPage;