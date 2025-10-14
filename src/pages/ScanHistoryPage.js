import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Modal,
  Button,
  TextField,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { format } from 'date-fns';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const ScanHistoryPage = ({ userProfile }) => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(false); // Start as false
  const [error, setError] = useState('');
  const [patients, setPatients] = useState([]); // State to hold the list of patients
  const [selectedPatientId, setSelectedPatientId] = useState(''); // State for the dropdown
  const [selectedScan, setSelectedScan] = useState(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Effect to fetch the list of all patients for the dropdown
  useEffect(() => {
    if (userProfile?.role === 'doctor') {
      const usersQuery = query(collection(db, 'users'), where('role', '==', 'user'));
      const unsubscribe = onSnapshot(usersQuery, (querySnapshot) => {
        const patientList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPatients(patientList);
        // If navigated from dashboard, pre-select the patient in the dropdown
        const patientIdFromState = location.state?.patientId;
        if (patientIdFromState) {
          setSelectedPatientId(patientIdFromState);
        }
      });
      return () => unsubscribe();
    }
  }, [userProfile, location.state]);

  // Effect to fetch scans when a patient is selected
  useEffect(() => {
    let unsubscribe = () => {};

    if (!userProfile) return;

    // Determine which user's scans to fetch. Priority to the dropdown selection.
    const userIdToQuery = selectedPatientId || (userProfile.role !== 'doctor' ? userProfile.uid : null);

    if (userIdToQuery) {
      setLoading(true);
      const scansQuery = query(collection(db, 'users', userIdToQuery, 'scans'), orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(scansQuery, (snapshot) => {
        const scansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setScans(scansData);
        setLoading(false);
      }, (err) => {
        console.error("Firebase query failed:", err);
        setError('Failed to load scan history.');
        setLoading(false);
      });
    } else {
      // If no patient is selected, clear the scans and stop loading
      setScans([]);
      setLoading(false);
    }

    return () => unsubscribe();
  }, [userProfile, selectedPatientId]);

  const handlePatientChange = (event) => {
    const patientId = event.target.value;
    setSelectedPatientId(patientId);
    // Update URL state so refreshing the page keeps the selection (optional but good UX)
    navigate(location.pathname, { state: { patientId }, replace: true });
  };

  const handleOpenModal = (scan) => {
    setSelectedScan(scan);
    setDoctorNotes(scan.doctorNotes || '');
  };

  const handleCloseModal = () => setSelectedScan(null);

  const handleSaveNotes = async () => {
    if (!selectedScan || !selectedPatientId) return;
    const scanDocRef = doc(db, 'users', selectedPatientId, 'scans', selectedScan.id);
    try {
      await updateDoc(scanDocRef, {
        doctorNotes: doctorNotes,
        status: 'Reviewed',
      });
      handleCloseModal();
    } catch(err) {
      console.error("Error saving notes:", err);
      setError("Failed to save notes.");
    }
  };
  
  const patientName = patients.find(p => p.id === selectedPatientId)?.displayName || '';

  return (
    <Container sx={{ py: 8 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        Scan History
      </Typography>

      {userProfile?.role === 'doctor' && (
        <FormControl fullWidth sx={{ mb: 4 }}>
          <InputLabel id="patient-history-select-label">Select a Patient</InputLabel>
          <Select
            labelId="patient-history-select-label"
            value={selectedPatientId}
            label="Select a Patient"
            onChange={handlePatientChange}
          >
            <MenuItem value=""><em>-- Select a patient to view their history --</em></MenuItem>
            {patients.map((patient) => (
              <MenuItem key={patient.id} value={patient.id}>{patient.displayName || patient.email}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {loading && <Box display="flex" justifyContent="center" alignItems="center" height="40vh"><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

      {!loading && selectedPatientId && (
        <>
          <Typography variant="h5" gutterBottom>
            Showing results for: <strong>{patientName}</strong>
          </Typography>
          {scans.length === 0 ? (
            <Paper sx={{p: 4, textAlign: 'center'}}>
              <Typography color="text.secondary">No scan history found for this patient.</Typography>
            </Paper>
          ) : (
            <Grid container spacing={4}>
              {scans.map((scan) => (
                <Grid item key={scan.id} xs={12} sm={6} md={4}>
                  <Card>
                    {scan.imageUrl && <CardMedia component="img" height="200" image={scan.imageUrl} alt="Scan" sx={{ objectFit: 'cover' }} />}
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold">{scan.result?.disease || 'N/A'}</Typography>
                      <Typography color="text.secondary" gutterBottom>
                        {scan.createdAt ? format(scan.createdAt.toDate(), 'PPPp') : 'No date'}
                      </Typography>
                      <Chip label={scan.result?.is_malignant ? "Concern" : "Benign"} color={scan.result?.is_malignant ? "error" : "success"} size="small" sx={{ mb: 1 }} />
                      <Chip label={scan.status || 'Pending'} color={scan.status === 'Reviewed' ? 'primary' : 'warning'} size="small" sx={{ mb: 1, ml: 1 }} />
                      {userProfile?.role === 'doctor' && (
                        <Button variant="outlined" size="small" fullWidth sx={{ mt: 2 }} onClick={() => handleOpenModal(scan)}>
                          {scan.status === 'Reviewed' ? 'Edit Notes' : 'Review & Add Notes'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {selectedScan && (
        <Modal open={!!selectedScan} onClose={handleCloseModal}>
          <Box sx={modalStyle}>
            <Typography variant="h6" component="h2">Review Scan</Typography>
            <TextField label="Doctor's Notes" multiline rows={4} fullWidth value={doctorNotes} onChange={(e) => setDoctorNotes(e.target.value)} sx={{ mt: 2, mb: 2 }}/>
            <Button variant="contained" onClick={handleSaveNotes}>Save Notes</Button>
            <Button sx={{ ml: 1 }} onClick={handleCloseModal}>Cancel</Button>
          </Box>
        </Modal>
      )}
    </Container>
  );
};

export default ScanHistoryPage;