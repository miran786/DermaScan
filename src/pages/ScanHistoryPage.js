import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, Grid, Paper, CircularProgress, Alert, Card, CardContent,
  CardMedia, Chip, Button, Dialog, DialogTitle, DialogContent, IconButton, List, ListItem,
  ListItemAvatar, Avatar, ListItemText, TextField, DialogActions, Divider, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Close as CloseIcon, ImageSearch as ImageSearchIcon, Person as PersonIcon, ArrowBack as ArrowBackIcon, Edit as EditIcon } from '@mui/icons-material';
import { collection, query, orderBy, onSnapshot, getDocs, doc, updateDoc, where, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { format } from 'date-fns';
import { useLocation, useNavigate } from 'react-router-dom';

const getStatusChipColor = (status) => {
    switch (status) {
        case 'Pending Review':
            return 'default';
        case 'Reviewed - Benign':
            return 'success';
        case 'Reviewed - Follow-up Required':
            return 'warning';
        case 'Urgent':
            return 'error';
        default:
            return 'default';
    }
};

const ScanHistoryPage = ({ userProfile }) => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedScan, setSelectedScan] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [currentNotes, setCurrentNotes] = useState('');
  const [currentMedication, setCurrentMedication] = useState('');
  const [currentStatus, setCurrentStatus] = useState('Pending Review');
  
  // For doctors
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Effect to handle doctor navigation from dashboard
  useEffect(() => {
    if (userProfile?.role === 'doctor' && location.state?.patientId) {
        const findPatient = patients.find(p => p.id === location.state.patientId);
        if (findPatient) {
            setSelectedPatient(findPatient);
        }
    }
  }, [location.state, patients, userProfile]);

  useEffect(() => {
    if (!userProfile) return;

    setLoading(true);

    if (userProfile.role === 'doctor') {
      const fetchPatients = async () => {
        try {
          const usersCollectionRef = collection(db, 'users');
          const q = query(usersCollectionRef, where('role', '==', 'user'), orderBy('displayName'));
          
          const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const patientsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPatients(patientsList);
            if (!location.state?.patientId) setLoading(false);
          }, (err) => {
            setError('Failed to fetch patient list.');
            console.error(err);
            setLoading(false);
          });
          return unsubscribe;
        } catch (err) {
          setError('Failed to fetch patient list.');
          console.error(err);
          setLoading(false);
        }
      };
      const unsub = fetchPatients();
      return () => unsub && unsub();

    } else {
      // For regular users
      const scansCollectionRef = collection(db, 'users', userProfile.uid, 'scans');
      const q = query(scansCollectionRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userScans = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setScans(userScans);
        setLoading(false);
      }, (err) => {
        setError('Failed to fetch scan history.');
        console.error(err);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [userProfile, location.state]);
  
  useEffect(() => {
    if (selectedPatient) {
        setLoading(true);
        const scansCollectionRef = collection(db, 'users', selectedPatient.id, 'scans');
        const q = query(scansCollectionRef, orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const userScans = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setScans(userScans);
            setLoading(false);
        }, (err) => {
            setError(`Failed to fetch scan history for ${selectedPatient.displayName}.`);
            console.error(err);
            setLoading(false);
        });
        
        return () => unsubscribe();
    }
  }, [selectedPatient]);

  const handleViewDetails = (scan) => {
    setSelectedScan(scan);
    setIsDetailOpen(true);
  };

  const handleOpenNotes = (scan) => {
    setSelectedScan(scan);
    setCurrentNotes(scan.doctorNotes || '');
    setCurrentMedication(scan.medication || '');
    setCurrentStatus(scan.status || 'Pending Review');
    setIsNotesOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedScan || !selectedPatient) return;
    const scanDocRef = doc(db, 'users', selectedPatient.id, 'scans', selectedScan.id);
    try {
        await updateDoc(scanDocRef, {
            doctorNotes: currentNotes,
            medication: currentMedication,
            status: currentStatus,
            reviewedBy: {
              uid: userProfile.uid,
              name: userProfile.displayName
            },
            reviewedAt: serverTimestamp(),
        });
        setIsNotesOpen(false);
        const updatedScanData = { ...selectedScan, doctorNotes: currentNotes, medication: currentMedication, status: currentStatus };
        setSelectedScan(updatedScanData);
    } catch (error) {
        console.error("Error updating notes:", error);
        setError("Failed to save notes.");
    }
  };

  const handleBackToPatientList = () => {
    setSelectedPatient(null); 
    setScans([]); 
    navigate('/history', { replace: true });
  }
  
  if (loading) {
    return <Box display="flex" justifyContent="center" sx={{ mt: 10 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Container sx={{ mt: 5 }}><Alert severity="error">{error}</Alert></Container>;
  }

  // Doctor View: Patient List
  if (userProfile.role === 'doctor' && !selectedPatient) {
    return (
        <Container sx={{ py: 8 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>Patient List</Typography>
            <Paper>
                <List>
                    {patients.map(patient => (
                        <ListItem button key={patient.id} onClick={() => setSelectedPatient(patient)} divider>
                            <ListItemAvatar>
                                <Avatar><PersonIcon /></Avatar>
                            </ListItemAvatar>
                            <ListItemText primary={patient.displayName} secondary={patient.email} />
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Container>
    );
  }

  // User or Doctor's Patient History View
  return (
    <Container sx={{ py: 8 }}>
      <Box mb={6}>
        {userProfile.role === 'doctor' && selectedPatient && (
            <Button startIcon={<ArrowBackIcon />} onClick={handleBackToPatientList} sx={{ mb: 2 }}>
                Back to Patient List
            </Button>
        )}
        <Typography variant="h3" fontWeight="bold" textAlign="center">
          {selectedPatient ? `${selectedPatient.displayName}'s Scan History` : 'Your Scan History'}
        </Typography>
      </Box>

      {scans.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 5, textAlign: 'center', mt: 5 }}>
          <ImageSearchIcon sx={{ fontSize: 60, color: 'grey.500', mb: 2 }}/>
          <Typography variant="h6">No Scans Found</Typography>
        </Paper>
      ) : (
        <Grid container spacing={4}>
          {scans.map((scan) => (
            <Grid item xs={12} sm={6} md={4} key={scan.id}>
              <Card elevation={8} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={scan.imageUrl || 'https://placehold.co/600x400/1e1e1e/e0e0e0?text=Scan'}
                  alt="Scan image"
                />
                <CardContent sx={{ flexGrow: 1 }}>
                   <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" fontWeight="bold">{scan.result.disease}</Typography>
                        <Chip 
                            label={scan.status || 'Pending Review'}
                            size="small"
                            color={getStatusChipColor(scan.status)}
                        />
                   </Box>
                  <Chip
                    label={scan.result.is_malignant ? "AI: Potential Concern" : "AI: Likely Benign"}
                    color={scan.result.is_malignant ? "error" : "success"}
                    size="small" sx={{ my: 1 }}/>
                  <Typography variant="body2" color="text.secondary">
                    Scanned on: {scan.createdAt ? format(scan.createdAt.toDate(), 'MMMM d, yyyy') : 'N/A'}
                  </Typography>
                </CardContent>
                <Box sx={{ p: 2 }}>
                  <Button fullWidth variant="outlined" onClick={() => handleViewDetails(scan)}>
                    View Details
                  </Button>
                  {userProfile.role === 'doctor' && (
                    <Button fullWidth variant="contained" startIcon={<EditIcon />} onClick={() => handleOpenNotes(scan)} sx={{ mt: 1 }}>
                        Doctor's Assessment
                    </Button>
                  )}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {selectedScan && (
        <Dialog open={isDetailOpen} onClose={() => setIsDetailOpen(false)} maxWidth="md">
          <DialogTitle>
            Scan Details
            <IconButton onClick={() => setIsDetailOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                 <img src={selectedScan.imageUrl} alt="Scan detail" style={{ width: '100%', borderRadius: '8px' }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h5" fontWeight="bold">{selectedScan.result.disease}</Typography>
                 <Box display="flex" alignItems="center" my={2} gap={2}>
                    <Chip label={`AI: ${selectedScan.result.is_malignant ? "Potential Concern" : "Likely Benign"}`} color={selectedScan.result.is_malignant ? "error" : "success"} />
                    <Chip label={`Status: ${selectedScan.status || 'Pending Review'}`} color={getStatusChipColor(selectedScan.status)} variant="outlined" />
                 </Box>
                <Typography variant="body1"><strong>AI Confidence:</strong> {Math.round(selectedScan.result.confidence * 100)}%</Typography>
                <Typography variant="body1"><strong>Scan Date:</strong> {selectedScan.createdAt ? format(selectedScan.createdAt.toDate(), 'MMMM d, yyyy, p') : 'N/A'}</Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">{selectedScan.result.description}</Typography>
                
                {(selectedScan.doctorNotes || selectedScan.medication) && (
                    <Box mt={3} p={2} borderRadius={2} bgcolor="background.default">
                        <Typography variant="h6" fontWeight="bold">Doctor's Assessment</Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}><strong>Notes:</strong> {selectedScan.doctorNotes || 'N/A'}</Typography>
                        <Typography variant="body1"><strong>Medication:</strong> {selectedScan.medication || 'N/A'}</Typography>
                        {selectedScan.reviewedBy && <Typography variant="caption" color="text.secondary">Reviewed by Dr. {selectedScan.reviewedBy.name}</Typography>}
                    </Box>
                )}
              </Grid>
            </Grid>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={isNotesOpen} onClose={() => setIsNotesOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add/Edit Doctor's Assessment</DialogTitle>
        <DialogContent>
            <FormControl fullWidth margin="dense" sx={{ mt: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                    value={currentStatus}
                    label="Status"
                    onChange={(e) => setCurrentStatus(e.target.value)}
                >
                    <MenuItem value="Pending Review">Pending Review</MenuItem>
                    <MenuItem value="Reviewed - Benign">Reviewed - Benign</MenuItem>
                    <MenuItem value="Reviewed - Follow-up Required">Reviewed - Follow-up Required</MenuItem>
                    <MenuItem value="Urgent">Urgent</MenuItem>
                </Select>
            </FormControl>
            <TextField
                autoFocus
                margin="dense"
                label="Doctor's Notes"
                multiline
                rows={4}
                fullWidth
                variant="outlined"
                value={currentNotes}
                onChange={(e) => setCurrentNotes(e.target.value)}
            />
            <TextField
                margin="dense"
                label="Prescribed Medication"
                multiline
                rows={2}
                fullWidth
                variant="outlined"
                value={currentMedication}
                onChange={(e) => setCurrentMedication(e.target.value)}
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setIsNotesOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNotes} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ScanHistoryPage;