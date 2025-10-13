import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Avatar,
  TextField,
  Button,
  Switch,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Lock as LockIcon,
  DeleteForever as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  // State for the delete confirmation dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reauthDialogOpen, setReauthDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setProfile({ uid: currentUser.uid, ...userDoc.data() });
          } else {
            setError("User profile data not found.");
          }
        } catch (err) {
          setError("Failed to fetch profile data.");
        }
      }
      setLoading(false);
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchProfile();
      } else {
        setLoading(false);
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleInputChange = (e) => setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleToggleChange = (e) => setProfile(prev => ({ ...prev, [e.target.name]: e.target.checked }));

  const handleSaveChanges = async () => {
    if (!profile) return;
    try {
      const userDocRef = doc(db, 'users', profile.uid);
      await updateDoc(userDocRef, {
        displayName: profile.displayName,
        phone: profile.phone,
        emailNotifications: profile.emailNotifications,
      });
      setEditMode(false);
      setSnackbar({ open: true, message: 'Profile updated successfully!' });
    } catch (err) {
      setError('Failed to update profile.');
    }
  };

  // --- NEW: Account Deletion Logic ---

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // First, delete the Firestore document
      const userDocRef = doc(db, 'users', user.uid);
      await deleteDoc(userDocRef);

      // Then, delete the user from Firebase Authentication
      await deleteUser(user);

      // No need to navigate, the onAuthStateChanged listener in App.js will handle it
      setSnackbar({ open: true, message: 'Account deleted successfully.' });
      setDeleteDialogOpen(false);
      setReauthDialogOpen(false);

    } catch (err) {
      console.error("Error deleting account:", err.code);
      if (err.code === 'auth/requires-recent-login') {
        // If recent login is required, open the re-authentication dialog
        setDeleteDialogOpen(false);
        setReauthDialogOpen(true);
        setDeleteError('For security, please enter your password again to delete your account.');
      } else {
        setDeleteError(err.message);
      }
    }
  };

  const handleReauthenticateAndDelete = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setDeleteError('');
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      // If re-authentication is successful, proceed with deletion
      await handleDeleteAccount();
    } catch (err) {
      console.error("Re-authentication error:", err.code);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setDeleteError('Incorrect password. Please try again.');
      } else {
        setDeleteError('An error occurred during re-authentication.');
      }
    }
  };


  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 10 }}><CircularProgress /></Box>;
  }

  if (error || !profile) {
    return <Container sx={{ mt: 5 }}><Alert severity="error">{error || "Could not load user profile."}</Alert></Container>;
  }

  return (
    <Box sx={{ py: 8 }}>
      <Container maxWidth="lg">
        <Box textAlign="center" mb={6}>
          <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ color: 'text.primary' }}>
            Account Settings
          </Typography>
        </Box>
        <Grid container spacing={4} mt={2}>
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={8} 
              sx={{ 
                p: 4, 
                textAlign: 'center', 
                borderRadius: 2,
                backgroundColor: 'background.paper',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 7px 14px rgba(50, 50, 93, 0.1), 0 3px 6px rgba(0, 0, 0, 0.08)'
                }
              }}
            >
              <Avatar sx={{ 
                width: 120, 
                height: 120, 
                mx: 'auto', 
                mb: 3, 
                bgcolor: 'primary.main', 
                fontSize: '3.5rem',
                fontWeight: 'bold'
              }}>
                {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : '?'}
              </Avatar>
              <Typography variant="h5" fontWeight="bold" sx={{ color: 'text.primary', mb: 1 }}>
                {profile.displayName}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: '0.95rem' }}>
                {profile.email}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper 
              elevation={8} 
              sx={{ 
                p: 4, 
                borderRadius: 2,
                backgroundColor: 'background.paper',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 7px 14px rgba(50, 50, 93, 0.1), 0 3px 6px rgba(0, 0, 0, 0.08)'
                }
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
                  Personal Information
                </Typography>
                <Button 
                  variant={editMode ? "contained" : "outlined"} 
                  startIcon={editMode ? <SaveIcon /> : <EditIcon />} 
                  onClick={() => editMode ? handleSaveChanges() : setEditMode(true)}
                  sx={{
                    fontWeight: 600,
                    px: 3
                  }}
                >
                  {editMode ? "Save Changes" : "Edit Profile"}
                </Button>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Full Name" name="displayName" value={profile.displayName} onChange={handleInputChange} disabled={!editMode} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Email Address" name="email" value={profile.email} disabled /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Phone Number" name="phone" value={profile.phone || ''} onChange={handleInputChange} disabled={!editMode} /></Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />
              <Typography variant="h6" fontWeight="bold" mb={2}>Settings</Typography>
              <List>
                <ListItem><ListItemIcon><NotificationsIcon /></ListItemIcon><ListItemText primary="Email Notifications" /><Switch edge="end" name="emailNotifications" checked={!!profile.emailNotifications} onChange={handleToggleChange} disabled={!editMode} /></ListItem>
                <ListItem><ListItemIcon><LockIcon /></ListItemIcon><ListItemText primary="Change Password" /><Button variant="outlined" size="small">Change</Button></ListItem>
              </List>

              <Divider sx={{ my: 4 }} />
              <Typography variant="h6" fontWeight="bold" color="error.main" mb={2}>Danger Zone</Typography>
              <Alert severity="error" variant="outlined" icon={<DeleteIcon />}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography fontWeight="bold">Delete Your Account</Typography>
                    <Typography variant="body2">This action is permanent and cannot be undone.</Typography>
                  </Box>
                  {/* Connect button to open the confirmation dialog */}
                  <Button variant="contained" color="error" size="small" onClick={() => setDeleteDialogOpen(true)}>
                    Delete Account
                  </Button>
                </Box>
              </Alert>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Are you absolutely sure?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action cannot be undone. This will permanently delete your account and remove your data from our servers.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteAccount} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Re-authentication Dialog */}
      <Dialog open={reauthDialogOpen} onClose={() => setReauthDialogOpen(false)}>
        <DialogTitle>Confirm Your Identity</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            To complete this action, please enter your password.
          </DialogContentText>
          {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            id="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReauthDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReauthenticateAndDelete} color="error">Confirm & Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} message={snackbar.message} />
    </Box>
  );
};

export default ProfilePage;

