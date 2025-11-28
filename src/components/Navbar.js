import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, FormControl, Select, MenuItem, InputLabel, Container, useScrollTrigger, Slide, IconButton } from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { usePatient } from '../context/PatientContext';

function HideOnScroll(props) {
  const { children, window } = props;
  const trigger = useScrollTrigger({
    target: window ? window() : undefined,
  });

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

const Navbar = ({ user, onLogout, window, mode, toggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { patients, selectedPatient, setSelectedPatient, loading } = usePatient();

  const handleLogoutClick = () => {
    setSelectedPatient(null);
    onLogout();
    navigate('/login');
  };

  const handlePatientChange = (event) => {
    const patientId = event.target.value;
    const patient = patients.find(p => p.id === patientId);
    setSelectedPatient(patient);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <HideOnScroll window={window}>
      <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: mode === 'dark' ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Box display="flex" alignItems="center" component={Link} to="/dashboard" sx={{ textDecoration: 'none', color: 'text.primary', mr: 4 }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.main',
                color: 'white',
                borderRadius: '12px',
                p: 1,
                mr: 1.5,
                boxShadow: '0 4px 12px rgba(0, 150, 136, 0.3)'
              }}>
                <MedicalInformationIcon fontSize="medium" />
              </Box>
              <Typography variant="h5" component="div" sx={{ fontWeight: 700, letterSpacing: '-0.5px' }}>
                Derma<span style={{ color: '#009688' }}>Scan</span>
              </Typography>
            </Box>

            {/* Global Patient Selector for Doctors */}
            {user?.role === 'doctor' && (
              <FormControl size="small" sx={{ minWidth: 200, mr: 2 }}>
                <InputLabel>Active Patient</InputLabel>
                <Select
                  value={selectedPatient ? selectedPatient.id : ''}
                  label="Active Patient"
                  onChange={handlePatientChange}
                  disabled={loading}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {patients.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.displayName || p.email}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Box sx={{ flexGrow: 1 }} />

            <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit">
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>

            {user ? (
              <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                {user.role === 'doctor' && (
                  <Button
                    color={isActive('/dashboard') ? "primary" : "inherit"}
                    component={Link}
                    to="/dashboard"
                    variant={isActive('/dashboard') ? "soft" : "text"}
                  >
                    Dashboard
                  </Button>
                )}
                <Button
                  color={isActive('/upload') ? "primary" : "inherit"}
                  component={Link}
                  to="/upload"
                  variant={isActive('/upload') ? "soft" : "text"}
                >
                  Upload
                </Button>
                <Button
                  color={isActive('/history') ? "primary" : "inherit"}
                  component={Link}
                  to="/history"
                  variant={isActive('/history') ? "soft" : "text"}
                >
                  History
                </Button>
                <Button
                  color={isActive('/profile') ? "primary" : "inherit"}
                  component={Link}
                  to="/profile"
                  variant={isActive('/profile') ? "soft" : "text"}
                >
                  Profile
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleLogoutClick}
                  sx={{ ml: 2, borderRadius: 50, px: 3 }}
                >
                  Logout
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 2, ml: 2 }}>
                <Button color="inherit" component={Link} to="/login" sx={{ fontWeight: 600 }}>Login</Button>
                <Button variant="contained" color="primary" component={Link} to="/signup" sx={{ borderRadius: 50, px: 4, boxShadow: '0 4px 14px 0 rgba(0,150,136,0.39)' }}>Sign Up</Button>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>
    </HideOnScroll>
  );
};

export default Navbar;
