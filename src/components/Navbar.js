import React from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import { NavLink } from 'react-router-dom';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';

// Accept 'user' and 'onLogout' as props
const Navbar = ({ user, onLogout }) => {
  const isAuthenticated = !!user; 

  return (
    <AppBar position="static" color="transparent" elevation={1}>
      <Container>
        <Toolbar disableGutters>
          <MedicalInformationIcon color="primary" sx={{ fontSize: 32, mr: 1.5 }} />
          <Typography
            variant="h5"
            component={NavLink}
            to="/"
            fontWeight="bold"
            sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
          >
            Derma<span style={{ color: '#1976d2' }}>Scan</span>
          </Typography>

          {/* NEW: Link to Library page for all users */}
          <Button component={NavLink} to="/library" color="inherit">
            Library
          </Button>

          {isAuthenticated ? (
            <Box>
              {/* CORRECTED: Link to Scan History for logged-in users */}
              <Button component={NavLink} to="/history" color="inherit">Scan History</Button>
              <Button component={NavLink} to="/profile" color="inherit">Profile</Button>
              <Button variant="outlined" color="primary" sx={{ ml: 2 }} onClick={onLogout}>
                Log Out
              </Button>
            </Box>
          ) : (
            <Box>
              <Button component={NavLink} to="/login" color="primary">Login</Button>
              <Button component={NavLink} to="/signup" variant="contained" color="primary" sx={{ ml: 2 }}>Sign Up</Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
