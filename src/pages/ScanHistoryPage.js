import React, { useState, useEffect } from 'react';
import {
  Container, Typography, List, ListItem, ListItemText, CircularProgress, Alert, Paper, Grid, Box, Button, Chip, Divider
} from '@mui/material';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions'; // Import functions
import { db, functions } from '../firebase/firebase'; // Import db and functions
import { usePatient } from '../context/PatientContext';
import { Science as ScienceIcon } from '@mui/icons-material';

const ScanHistoryPage = () => {
    const { selectedPatient } = usePatient();
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [analyzingId, setAnalyzingId] = useState(null); // To track which scan is being analyzed

    useEffect(() => {
        if (selectedPatient) {
            setLoading(true);
            const scansCollectionRef = collection(db, 'users', selectedPatient.id, 'scans');
            const q = query(scansCollectionRef, orderBy('createdAt', 'desc'));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const scansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setScans(scansData);
                setLoading(false);
            }, (err) => {
                setError('Failed to fetch scan history. Please try again later.');
                setLoading(false);
                console.error(err);
            });

            return () => unsubscribe();
        } else {
            setScans([]);
        }
    }, [selectedPatient]);

    // This is the new function to handle the AI analysis
    const handleAnalyzeScan = async (scanId, imageUrl) => {
        if (!selectedPatient) return;
        setAnalyzingId(scanId); // Set loading state for this specific scan
        try {
            const analyzeImageFunction = httpsCallable(functions, 'analyzeImageWithGoogle');
            const response = await analyzeImageFunction({ imageUrl });
            const result = response.data;

            // Update the document in Firestore with the new analysis result
            const scanDocRef = doc(db, 'users', selectedPatient.id, 'scans', scanId);
            await updateDoc(scanDocRef, {
                result: result,
                status: 'Reviewed',
                doctorNotes: 'AI analysis completed from history page.'
            });

        } catch (err) {
            console.error("Analysis failed: ", err);
            alert("An error occurred during analysis. Please check the console.");
        } finally {
            setAnalyzingId(null); // Reset loading state
        }
    };

    if (!selectedPatient) {
        return (
            <Container sx={{ py: 4 }}>
                <Alert severity="info">Please select a patient from the dashboard to view their scan history.</Alert>
            </Container>
        );
    }

    return (
        <Container sx={{ py: 4, backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
            <Typography variant="h4" gutterBottom fontWeight="bold" color="primary.main">
                Scan History for {selectedPatient.displayName || selectedPatient.email}
            </Typography>
            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}
            {!loading && scans.length === 0 && (
                <Typography>No scan history found for this patient.</Typography>
            )}
            <List>
                {scans.map((scan) => (
                    <Paper key={scan.id} elevation={3} sx={{ mb: 3, borderRadius: '12px' }}>
                        <ListItem sx={{ p: 3 }}>
                            <Grid container spacing={3} alignItems="center">
                                <Grid item xs={12} md={4}>
                                    <Box sx={{ borderRadius: '8px', overflow: 'hidden' }}>
                                        <img src={scan.imageUrl} alt="Scan" style={{ width: '100%', height: 'auto', display: 'block' }} />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={8}>
                                    <ListItemText
                                        primary={
                                            <Typography variant="h6" fontWeight="bold">
                                                Scan taken on: {scan.createdAt ? new Date(scan.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                            </Typography>
                                        }
                                        secondary={
                                            <>
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                                                    Status: <Chip label={scan.status || 'Unknown'} size="small" color={scan.status === 'Pending Review' ? 'warning' : 'success'} />
                                                </Typography>
                                                <Divider sx={{ my: 2 }} />
                                                
                                                {/* THIS IS THE NEW LOGIC */}
                                                {scan.result && scan.result.disease === 'Awaiting Analysis' ? (
                                                    <Box>
                                                        <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary', mb: 2 }}>
                                                            This scan has not yet been analyzed by the AI.
                                                        </Typography>
                                                        <Button
                                                            variant="contained"
                                                            startIcon={analyzingId === scan.id ? <CircularProgress size={20} color="inherit" /> : <ScienceIcon />}
                                                            onClick={() => handleAnalyzeScan(scan.id, scan.imageUrl)}
                                                            disabled={analyzingId === scan.id}
                                                        >
                                                            {analyzingId === scan.id ? 'Analyzing...' : 'Analyze Now'}
                                                        </Button>
                                                    </Box>
                                                ) : (
                                                    <Box>
                                                        <Chip 
                                                            label={scan.result?.is_malignant ? "Potential Concern" : "Likely Benign"} 
                                                            color={scan.result?.is_malignant ? "error" : "success"} 
                                                            sx={{ mb: 1.5, fontWeight: 'bold' }} 
                                                        />
                                                        <Typography variant="h5" gutterBottom>{scan.result?.disease}</Typography>
                                                        <Typography variant="body1" sx={{ mb: 1 }}>
                                                            <strong>Confidence:</strong> {scan.result?.confidence ? `${Math.round(scan.result.confidence * 100)}%` : 'N/A'}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">{scan.result?.description}</Typography>
                                                    </Box>
                                                )}
                                            </>
                                        }
                                    />
                                </Grid>
                            </Grid>
                        </ListItem>
                    </Paper>
                ))}
            </List>
        </Container>
    );
};

export default ScanHistoryPage;