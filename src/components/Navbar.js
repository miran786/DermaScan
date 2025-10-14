import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, FormControl, Select, MenuItem, InputLabel } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import { usePatient } from '../context/PatientContext'; // Import the custom hook

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { patients, selectedPatient, setSelectedPatient, loading } = usePatient();

  const handleLogoutClick = () => {
    setSelectedPatient(null); // Clear selected patient on logout
    onLogout();
    navigate('/login');
  };

  const handlePatientChange = (event) => {
      const patientId = event.target.value;
      const patient = patients.find(p => p.id === patientId);
      setSelectedPatient(patient);
  };

  return (
    <AppBar position="static" color="transparent" elevation={1} sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
      <Toolbar>
        <Box display="flex" alignItems="center" component={Link} to="/dashboard" sx={{ textDecoration: 'none', color: 'inherit' }}>
            <MedicalInformationIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Derma<span style={{ color: '#3498db' }}>Scan</span>
            </Typography>
        </Box>

        {/* Global Patient Selector for Doctors */}
        {user?.role === 'doctor' && (
            <FormControl size="small" sx={{ ml: 3, minWidth: 220 }}>
                <InputLabel>Active Patient</InputLabel>
                <Select
                    value={selectedPatient ? selectedPatient.id : ''}
                    label="Active Patient"
                    onChange={handlePatientChange}
                    disabled={loading}
                >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {patients.map((p) => (
                        <MenuItem key={p.id} value={p.id}>{p.displayName || p.email}</MenuItem>
                    ))}
                </Select>
            </FormControl>
        )}

        <Box sx={{ flexGrow: 1 }} />
        {user ? (
          <Box>
            {user.role === 'doctor' && <Button color="inherit" component={Link} to="/dashboard">Dashboard</Button>}
            <Button color="inherit" component={Link} to="/upload">Upload Image</Button>
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
