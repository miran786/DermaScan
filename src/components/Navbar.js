import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <AppBar position="static" color="transparent" elevation={1} sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
      <Toolbar>
        <Box display="flex" alignItems="center" component={Link} to="/dashboard" sx={{ textDecoration: 'none', color: 'inherit' }}>
            <MedicalInformationIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Derma<span style={{ color: '#3498db' }}>Scan</span>
            </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        {user ? (
          <Box>
            {/* The Dashboard button now shows for ANY logged-in user */}
            <Button color="inherit" component={Link} to="/dashboard">Dashboard</Button>
            <Button color="inherit" component={Link} to="/history">Scan History</Button>
            <Button color="inherit" component={Link} to="/profile">Profile</Button>
            <Button color="primary" variant="outlined" onClick={handleLogoutClick}>Logout</Button>
          </Box>
        ) : (
          <Box>
            <Button color="inherit" component={Link} to="/login">Login</Button>
            <Button variant="contained" color="primary" component={Link} to="/signup">Sign Up</Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;