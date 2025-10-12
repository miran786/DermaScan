import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Link as MuiLink
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Login as LoginIcon,
  MedicalInformation as MedicalInformationIcon,
} from '@mui/icons-material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/'); // Redirect to home page on successful login
    } catch (err) {
      let errorMessage = 'An unknown error occurred. Please try again.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Access temporarily disabled due to too many failed login attempts. Please try again later.';
      }
      setError(errorMessage);
      console.error('Firebase Login Error:', err.code, err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={6}
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 4,
          borderRadius: 2
        }}
      >
        <MedicalInformationIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
        <Typography component="h1" variant="h5" fontWeight="bold">
          Welcome Back
        </Typography>
        <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
          {error && <Alert severity="error" sx={{ my: 2, width: '100%' }}>{error}</Alert>}
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
          <Box textAlign="center">
            <MuiLink component={RouterLink} to="/signup" variant="body2">
              {"Don't have an account? Sign Up"}
            </MuiLink>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;
