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
  PersonAdd as PersonAddIcon,
  MedicalInformation as MedicalInformationIcon,
} from '@mui/icons-material';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const SignupPage = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
        setError("Password should be at least 6 characters long.");
        setLoading(false);
        return;
    }

    try {
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Create user document in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        displayName: displayName,
        email: user.email,
        createdAt: serverTimestamp(),
        role: 'user', // Default role for new signups
        status: 'active',
      });

      navigate('/'); // Redirect to home page on successful signup
    } catch (err) {
      let errorMessage = 'An unknown error occurred. Please try again.';
       if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already registered. Please login instead.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'The password is too weak. Please use a stronger password.';
      }
      setError(errorMessage);
      console.error('Firebase Signup Error:', err.code, err.message);
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
          Create Your Account
        </Typography>
        <Box component="form" onSubmit={handleSignup} sx={{ mt: 1, width: '100%' }}>
          {error && <Alert severity="error" sx={{ my: 2, width: '100%' }}>{error}</Alert>}
          <TextField
            margin="normal"
            required
            fullWidth
            id="displayName"
            label="Full Name"
            name="displayName"
            autoComplete="name"
            autoFocus
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
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
            autoComplete="new-password"
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
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PersonAddIcon />}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
          <Box textAlign="center">
            <MuiLink component={RouterLink} to="/login" variant="body2">
              {"Already have an account? Sign In"}
            </MuiLink>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default SignupPage;
