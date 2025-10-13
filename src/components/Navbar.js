import React from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box, Avatar } from '@mui/material';
import { NavLink } from 'react-router-dom';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';

// Accept 'user' and 'onLogout' as props
const Navbar = ({ user, onLogout }) => {
  const isAuthenticated = !!user; 

  return (
    <AppBar 
      position="static" 
      sx={{ 
        backgroundColor: 'rgba(39, 41, 61, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(52, 73, 94, 0.2)',
        boxShadow: '0 1px 20px 0 rgba(0, 0, 0, 0.3)'
      }}
      elevation={0}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ py: 1 }}>
          <MedicalInformationIcon color="primary" sx={{ fontSize: 36, mr: 2 }} />
          <Typography
            variant="h5"
            component={NavLink}
            to="/"
            fontWeight="bold"
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none', 
              color: 'text.primary',
              '&:hover': {
                color: 'primary.main'
              }
            }}
          >
            Derma<span style={{ color: '#34495e' }}>Scan</span>
          </Typography>

          {/* Link to Library page for all users */}
          <Button 
            component={NavLink} 
            to="/library" 
            sx={{ 
              color: 'text.primary',
              fontWeight: 500,
              mr: 2,
              '&:hover': {
                backgroundColor: 'rgba(52, 73, 94, 0.1)'
              }
            }}
          >
            Library
          </Button>

          {isAuthenticated ? (
            <Box display="flex" alignItems="center" gap={1}>
              <Button 
                component={NavLink} 
                to="/history" 
                sx={{ 
                  color: 'text.primary',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: 'rgba(225, 78, 202, 0.1)'
                  }
                }}
              >
                Scan History
              </Button>
              <Button 
                component={NavLink} 
                to="/profile" 
                sx={{ 
                  color: 'text.primary',
                  fontWeight: 500,
                  mr: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(225, 78, 202, 0.1)'
                  }
                }}
              >
                Profile
              </Button>
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  mr: 2, 
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem'
                }}
              >
                {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={onLogout}
                sx={{ 
                  fontWeight: 600,
                  borderColor: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    backgroundColor: 'primary.main',
                    color: 'white'
                  }
                }}
              >
                Log Out
              </Button>
            </Box>
          ) : (
            <Box display="flex" alignItems="center" gap={1}>
              <Button 
                component={NavLink} 
                to="/login" 
                color="primary"
                sx={{ 
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: 'rgba(225, 78, 202, 0.1)'
                  }
                }}
              >
                Login
              </Button>
              <Button 
                component={NavLink} 
                to="/signup" 
                variant="contained" 
                color="primary"
                sx={{ 
                  fontWeight: 600,
                  ml: 1,
                  px: 3,
                  '&:hover': {
                    backgroundColor: 'primary.dark'
                  }
                }}
              >
                Sign Up
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
