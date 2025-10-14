import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Grid, Card, CardContent, CardMedia, CircularProgress, Box, Alert, Chip, Button, Modal, TextField, Paper, IconButton, Checkbox, FormControlLabel
} from '@mui/material';
import { collection, query, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { format } from 'date-fns';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { usePatient } from '../context/PatientContext'; // Import context hook

// Modal style
const modalStyle = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: { xs: '95%', sm: '90%', md: 1000 }, // Wider modal for better horizontal comparison
  bgcolor: 'background.paper',
  boxShadow: 24, p: 4, borderRadius: 2,
};

const ScanHistoryPage = ({ userProfile }) => {
  const { selectedPatient } = usePatient(); // Get patient from global context
  // If doctor is viewing, use selectedPatient. If patient is viewing, use their own profile.
  const activePatient = userProfile?.role === 'doctor' ? selectedPatient : { id: userProfile?.uid, displayName: userProfile?.displayName };
  
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [currentScan, setCurrentScan] = useState(null);
  const [prescriptionText, setPrescriptionText] = useState('');
  
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);

  useEffect(() => {
    if (!activePatient?.id) {
      setError(userProfile?.role === 'doctor' ? 'Please select a patient from the dropdown in the navigation bar to view their history.' : 'Could not find user profile.');
      setLoading(false);
      setScans([]); // Clear scans if no patient is selected
      return;
    }

    setLoading(true);
    setError(''); // Reset error on new patient selection

    const scansQuery = query(collection(db, 'users', activePatient.id, 'scans'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(scansQuery, (querySnapshot) => {
      const scansData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setScans(scansData);
      setLoading(false);
    }, (err) => {
      setError('Failed to fetch scan history.');
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activePatient, userProfile]);

  const handleOpenPrescriptionModal = (scan) => {
    setCurrentScan(scan);
    setPrescriptionText(scan.prescription || '');
    setPrescriptionModalOpen(true);
  };

  const handleClosePrescriptionModal = () => {
    setPrescriptionModalOpen(false);
  };

  const handleSavePrescription = async () => {
    if (!currentScan || !activePatient?.id) return;
    const scanDocRef = doc(db, 'users', activePatient.id, 'scans', currentScan.id);
    try {
      await updateDoc(scanDocRef, { prescription: prescriptionText });
      handleClosePrescriptionModal();
    } catch (err) {
      console.error("Error saving prescription: ", err);
    }
  };
  
  const handleComparisonSelect = (scanId) => {
    setSelectedForComparison(prev => {
        const isSelected = prev.includes(scanId);
        if (isSelected) return prev.filter(id => id !== scanId);
        if (prev.length < 2) return [...prev, scanId];
        return prev;
    });
  };
  
  const handleOpenComparisonModal = () => {
    if(selectedForComparison.length === 2) setComparisonModalOpen(true);
  };

  const handleCloseComparisonModal = () => setComparisonModalOpen(false);
  
  const comparisonScans = scans.filter(scan => selectedForComparison.includes(scan.id));

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" height="80vh"><CircularProgress /></Box>;
  }

  return (
    <Container sx={{ py: 8 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        Scan History for {activePatient?.displayName || '...'}
      </Typography>
      
      {error && <Alert severity="warning" sx={{ mb: 4 }}>{error}</Alert>}
      
      {selectedForComparison.length === 2 && (
        <Paper elevation={3} sx={{ p: 2, mb: 4, display: 'flex', justifyContent: 'center' }}>
            <Button variant="contained" startIcon={<CompareArrowsIcon />} onClick={handleOpenComparisonModal}>Compare 2 Selected Images</Button>
        </Paper>
      )}

      {!loading && !error && scans.length === 0 && (
        <Typography>No scan history found for this patient.</Typography>
      )}

      <Grid container spacing={4}>
        {scans.map((scan) => (
          <Grid item key={scan.id} xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, boxShadow: 6 }}>
              <CardMedia component="img" height="250" image={scan.imageUrl} alt="Scan result" />
              <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip label={scan.result?.is_malignant ? "Potential Concern" : "Likely Benign"} color={scan.result?.is_malignant ? "error" : "success"} size="small" sx={{ mb: 1, fontWeight: 'bold' }} />
                    <FormControlLabel control={<Checkbox checked={selectedForComparison.includes(scan.id)} onChange={() => handleComparisonSelect(scan.id)} disabled={selectedForComparison.length >= 2 && !selectedForComparison.includes(scan.id)} />} label="Compare" />
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>{scan.result?.disease || 'N/A'}</Typography>
                  <Box display="flex" alignItems="center" color="text.secondary" mb={2}><CalendarTodayIcon fontSize="small" sx={{ mr: 1 }}/><Typography variant="body2">{scan.createdAt ? format(scan.createdAt.toDate(), 'PPP') : 'No date'}</Typography></Box>
                  <Typography variant="body2" color="text.secondary" paragraph>{scan.result?.description || 'No detailed description.'}</Typography>
                  {scan.prescription && <Paper variant="outlined" sx={{ p: 2, mt: 2, backgroundColor: 'action.hover' }}><Typography variant="subtitle2" fontWeight="bold">Doctor's Prescription:</Typography><Typography variant="body2" sx={{whiteSpace: 'pre-wrap'}}>{scan.prescription}</Typography></Paper>}
              </CardContent>
              {userProfile?.role === 'doctor' && <Box sx={{ p: 2, pt: 0 }}><Button fullWidth variant="outlined" startIcon={<EditIcon />} onClick={() => handleOpenPrescriptionModal(scan)}>{scan.prescription ? 'Edit Prescription' : 'Add Prescription'}</Button></Box>}
            </Card>
          </Grid>
        ))}
      </Grid>

      <Modal open={prescriptionModalOpen} onClose={handleClosePrescriptionModal}><Box sx={modalStyle}>
          <Typography variant="h6" component="h2" fontWeight="bold">Add/Edit Prescription</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>For scan taken on {currentScan?.createdAt ? format(currentScan.createdAt.toDate(), 'PPP') : ''}</Typography>
          <TextField fullWidth multiline rows={8} label="Prescription and Notes" value={prescriptionText} onChange={(e) => setPrescriptionText(e.target.value)} />
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}><Button onClick={handleClosePrescriptionModal}>Cancel</Button><Button variant="contained" onClick={handleSavePrescription} sx={{ ml: 2 }}>Save</Button></Box>
      </Box></Modal>

      <Modal open={comparisonModalOpen} onClose={handleCloseComparisonModal}><Box sx={modalStyle}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}><Typography variant="h5" component="h2" fontWeight="bold">Scan Comparison</Typography><IconButton onClick={handleCloseComparisonModal}><CloseIcon/></IconButton></Box>
          <Grid container spacing={3}>
              {comparisonScans.map(scan => (
                  <Grid item xs={6} key={scan.id}> {/* Changed to xs={6} for horizontal layout */}
                      <Paper variant="outlined">
                          <CardMedia component="img" image={scan.imageUrl} alt="Scan to compare" sx={{ borderBottom: 1, borderColor: 'divider', height: 300, objectFit: 'contain' }} />
                          <CardContent>
                              <Typography variant="h6">{scan.result?.disease}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                  {scan.createdAt ? format(scan.createdAt.toDate(), 'PPP p') : 'No date'}
                              </Typography>
                          </CardContent>
                      </Paper>
                  </Grid>
              ))}
          </Grid>
      </Box></Modal>
    </Container>
  );
};

export default ScanHistoryPage;

