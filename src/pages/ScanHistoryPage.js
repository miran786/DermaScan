import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import {
    Container,
    Typography,
    Grid,
    Card,
    CardMedia,
    CardContent,
    Chip,
    Box,
    CircularProgress,
    Divider,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { format } from 'date-fns';
import { usePatient } from '../context/PatientContext';

const ScanHistoryPage = ({ userProfile }) => {
    const { selectedPatient } = usePatient();
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);

    // Dialog State
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedScan, setSelectedScan] = useState(null);
    const [correctionData, setCorrectionData] = useState({
        prediction: '',
        severity: '',
        notes: ''
    });

    useEffect(() => {
        const fetchScans = async () => {
            if (!userProfile) return;

            let targetUserId = userProfile.uid;

            // If doctor, use the selected patient's ID
            if (userProfile.role === 'doctor') {
                if (selectedPatient) {
                    targetUserId = selectedPatient.id;
                } else {
                    // If doctor but no patient selected, show empty
                    setScans([]);
                    setLoading(false);
                    return;
                }
            }

            try {
                // Query without orderBy to avoid needing a composite index
                const q = query(
                    collection(db, 'scans'),
                    where('userId', '==', targetUserId)
                );
                console.log("ScanHistoryPage: Querying scans for userId:", targetUserId);

                const querySnapshot = await getDocs(q);
                console.log("ScanHistoryPage: Found " + querySnapshot.size + " scans.");

                const scanData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Sort client-side
                scanData.sort((a, b) => {
                    const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
                    const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
                    return timeB - timeA;
                });

                console.log("ScanHistoryPage: Scans after sort:", scanData);

                setScans(scanData);
            } catch (error) {
                console.error("Error fetching scans: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchScans();
    }, [userProfile, selectedPatient]);

    const handleEditClick = (scan) => {
        setSelectedScan(scan);
        setCorrectionData({
            prediction: scan.correctedResult?.prediction || scan.result?.prediction || '',
            severity: scan.correctedResult?.severity || scan.result?.severity || '',
            notes: scan.doctorNotes || ''
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedScan(null);
    };

    const handleSaveCorrection = async () => {
        if (!selectedScan) return;

        try {
            const scanRef = doc(db, 'scans', selectedScan.id);

            const updateData = {
                doctorNotes: correctionData.notes,
                isCorrected: true,
                correctedResult: {
                    prediction: correctionData.prediction,
                    severity: correctionData.severity,
                    timestamp: new Date()
                }
            };

            await updateDoc(scanRef, updateData);

            // Update local state
            setScans(prevScans => prevScans.map(scan =>
                scan.id === selectedScan.id
                    ? { ...scan, ...updateData }
                    : scan
            ));

            handleCloseDialog();
        } catch (error) {
            console.error("Error updating scan: ", error);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 6 }}>
            <Box sx={{ mb: 5 }}>
                <Typography variant="h3" fontWeight="bold" color="primary" gutterBottom>
                    Scan History
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    View your past skin analysis results and track changes over time.
                </Typography>
            </Box>

            {scans.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'background.paper', borderRadius: 4 }}>
                    <Typography variant="h5" color="text.secondary">No scans found.</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                        {userProfile?.role === 'doctor'
                            ? "Select a patient to view their history."
                            : "Upload a new image to get started."}
                    </Typography>
                </Box>
            ) : (
                <Grid container spacing={4}>
                    {scans.map((scan) => {
                        // Determine which result to show (Corrected takes precedence)
                        const displayResult = scan.isCorrected ? scan.correctedResult : scan.result;
                        const isCorrected = scan.isCorrected;

                        return (
                            <Grid item key={scan.id} xs={12} sm={6} md={4}>
                                <Card sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 6
                                    },
                                    position: 'relative',
                                    border: isCorrected ? '2px solid #009688' : 'none' // Highlight corrected scans
                                }}>
                                    {isCorrected && (
                                        <Box sx={{
                                            position: 'absolute',
                                            top: 12,
                                            right: 12,
                                            bgcolor: 'white',
                                            borderRadius: '50%',
                                            p: 0.5,
                                            boxShadow: 2,
                                            zIndex: 1
                                        }}>
                                            <CheckCircleIcon color="primary" />
                                        </Box>
                                    )}

                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={scan.imageUrl}
                                        alt="Scan result"
                                        sx={{ objectFit: 'cover' }}
                                    />
                                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Chip
                                                label={displayResult?.prediction || "Unknown"}
                                                color={displayResult?.severity === 'High' ? "error" : "success"}
                                                variant={isCorrected ? "filled" : "outlined"} // Filled for verified/corrected
                                                size="small"
                                                sx={{ fontWeight: 600 }}
                                            />
                                            <Typography variant="caption" color="text.secondary" display="flex" alignItems="center">
                                                <CalendarTodayIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                                                {scan.timestamp ? format(scan.timestamp.toDate(), 'MMM dd, yyyy') : 'N/A'}
                                            </Typography>
                                        </Box>

                                        <Divider sx={{ my: 1.5 }} />

                                        {!isCorrected && (
                                            <Typography variant="body2" color="text.secondary" paragraph>
                                                <strong>Confidence:</strong> {displayResult?.confidence ? (displayResult.confidence * 100).toFixed(1) + '%' : 'N/A'}
                                            </Typography>
                                        )}

                                        {scan.doctorNotes && (
                                            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                                                <Typography variant="caption" fontWeight="bold" color="primary" display="block" gutterBottom>
                                                    Doctor's Note:
                                                </Typography>
                                                <Typography variant="body2" color="text.primary">
                                                    {scan.doctorNotes}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Doctor Actions */}
                                        {userProfile?.role === 'doctor' && (
                                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                                <Button
                                                    startIcon={<EditIcon />}
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => handleEditClick(scan)}
                                                >
                                                    {isCorrected ? "Edit Correction" : "Correct Diagnosis"}
                                                </Button>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Edit Diagnosis Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
                <DialogTitle>
                    {selectedScan?.isCorrected ? "Edit Correction" : "Correct Diagnosis"}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                        <TextField
                            label="Diagnosis / Prediction"
                            fullWidth
                            value={correctionData.prediction}
                            onChange={(e) => setCorrectionData({ ...correctionData, prediction: e.target.value })}
                        />

                        <FormControl fullWidth>
                            <InputLabel>Severity</InputLabel>
                            <Select
                                value={correctionData.severity}
                                label="Severity"
                                onChange={(e) => setCorrectionData({ ...correctionData, severity: e.target.value })}
                            >
                                <MenuItem value="Low">Low</MenuItem>
                                <MenuItem value="Medium">Medium</MenuItem>
                                <MenuItem value="High">High</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="Doctor's Notes"
                            fullWidth
                            multiline
                            rows={4}
                            value={correctionData.notes}
                            onChange={(e) => setCorrectionData({ ...correctionData, notes: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
                    <Button onClick={handleSaveCorrection} variant="contained" color="primary">
                        Save Correction
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default ScanHistoryPage;
