import React, { useState } from 'react';
import { storage, db, auth } from '../firebase/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
    Container,
    Typography,
    Button,
    Box,
    CircularProgress,
    Paper,
    Card,
    CardMedia,
    CardContent,
    Alert,
    Stack
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { usePatient } from '../context/PatientContext';

const UploadPage = () => {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState('');
    const { selectedPatient } = usePatient();

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setAnalysisResult(null);
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!image) return;

        // Check if a patient is selected (for doctors) or default to current user
        const currentUser = auth.currentUser;
        const patientId = selectedPatient ? selectedPatient.id : currentUser.uid;

        if (!patientId) {
            setError("No patient selected or user not logged in.");
            return;
        }

        setUploading(true);
        setError('');

        try {
            const storageRef = ref(storage, `scans/${patientId}/${Date.now()}_${image.name}`);
            await uploadBytes(storageRef, image);
            const url = await getDownloadURL(storageRef);

            // --- SIMULATED AI ANALYSIS ---
            // In a real app, you might call a Cloud Function here or wait for a trigger.
            const simulatedResult = {
                prediction: "Benign Keratosis",
                confidence: 0.92,
                severity: "Low",
                recommendation: "Monitor for changes. Consult a dermatologist if it grows or bleeds."
            };
            // -----------------------------

            await addDoc(collection(db, 'scans'), {
                userId: patientId, // Associate scan with the patient
                imageUrl: url,
                timestamp: serverTimestamp(),
                result: simulatedResult,
                doctorNotes: "" // Initialize empty notes
            });

            setAnalysisResult(simulatedResult);
        } catch (error) {
            console.error("Error uploading image: ", error);
            setError("Failed to upload image. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ py: 6 }}>
            <Box sx={{ textAlign: 'center', mb: 5 }}>
                <Typography variant="h3" fontWeight="bold" color="primary" gutterBottom>
                    Skin Lesion Analysis
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    Upload a clear image of the skin area for instant AI-powered analysis.
                </Typography>
            </Box>

            <Paper
                elevation={0}
                sx={{
                    p: 4,
                    border: '2px dashed',
                    borderColor: 'primary.light',
                    borderRadius: 4,
                    bgcolor: 'background.default',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    mb: 4,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover'
                    }
                }}
            >
                <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="raised-button-file"
                    type="file"
                    onChange={handleImageChange}
                />
                <label htmlFor="raised-button-file">
                    <Button
                        variant="contained"
                        component="span"
                        startIcon={<CloudUploadIcon />}
                        size="large"
                        sx={{ px: 4, py: 1.5, borderRadius: 50 }}
                    >
                        Select Image
                    </Button>
                </label>
                <Typography variant="body2" color="text.secondary">
                    Supported formats: JPEG, PNG
                </Typography>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {preview && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <Card sx={{ maxWidth: 400, width: '100%', borderRadius: 4, overflow: 'hidden' }}>
                        <CardMedia
                            component="img"
                            height="300"
                            image={preview}
                            alt="Skin Lesion"
                        />
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="subtitle1" fontWeight="medium">Selected Image</Typography>
                        </CardContent>
                    </Card>

                    {!analysisResult && (
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={handleUpload}
                            disabled={uploading}
                            size="large"
                            sx={{ px: 6, py: 1.5, borderRadius: 50, fontSize: '1.1rem' }}
                        >
                            {uploading ? <CircularProgress size={24} color="inherit" /> : 'Analyze Image'}
                        </Button>
                    )}
                </Box>
            )}

            {analysisResult && (
                <Box sx={{ mt: 6 }}>
                    <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon color="success" fontSize="large" /> Analysis Results
                    </Typography>
                    <Paper elevation={3} sx={{ p: 4, borderRadius: 4, bgcolor: '#e8f5e9' }}>
                        <Stack spacing={2}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6" color="text.secondary">Prediction:</Typography>
                                <Typography variant="h5" fontWeight="bold" color="primary.dark">{analysisResult.prediction}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6" color="text.secondary">Confidence:</Typography>
                                <Typography variant="h6" fontWeight="medium">{(analysisResult.confidence * 100).toFixed(1)}%</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6" color="text.secondary">Severity:</Typography>
                                <Typography variant="h6" fontWeight="medium" color={analysisResult.severity === 'High' ? 'error' : 'success'}>
                                    {analysisResult.severity}
                                </Typography>
                            </Box>
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Recommendation:</Typography>
                                <Typography variant="body1">{analysisResult.recommendation}</Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </Box>
            )}
        </Container>
    );
};

export default UploadPage;
