import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Avatar,
  ListItemAvatar,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { CloudUpload as CloudUploadIcon, ArrowForward as ArrowForwardIcon, Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import PeopleIcon from '@mui/icons-material/People';
import { collectionGroup, query, where, onSnapshot, addDoc, collection, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { db, storage, functions, auth } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const UploadBox = styled(Box)(({ theme }) => ({
    border: `2px dashed ${theme.palette.primary.light}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(4),
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(52, 73, 94, 0.03)',
    textAlign: 'center',
    cursor: 'pointer',
    '&:hover': {
      borderColor: theme.palette.primary.main,
      backgroundColor: 'rgba(52, 73, 94, 0.08)',
    },
}));

const ResultCard = styled(Card)(({ theme, isMalignant }) => ({
    backgroundColor: isMalignant ? 'rgba(231, 76, 60, 0.1)' : 'rgba(52, 152, 219, 0.1)',
    borderLeft: `5px solid ${isMalignant ? theme.palette.secondary.main : theme.palette.primary.main}`,
}));

const DoctorDashboard = () => {
    const [pendingScans, setPendingScans] = React.useState([]);
    const [stats, setStats] = React.useState({ patients: 0, reviewed: 0, pending: 0 });
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [patients, setPatients] = React.useState([]);
    const navigate = useNavigate();

    const [selectedPatientForUpload, setSelectedPatientForUpload] = React.useState('');
    const [selectedImage, setSelectedImage] = React.useState(null);
    const [previewUrl, setPreviewUrl] = React.useState('');
    const [uploading, setUploading] = React.useState(false);
    const [uploadError, setUploadError] = React.useState('');
    const fileInputRef = React.useRef(null);
    
    // State for the new analysis result section
    const [analysisResult, setAnalysisResult] = React.useState(null);
    const [isEditing, setIsEditing] = React.useState(false);
    const [editedResult, setEditedResult] = React.useState(null);
    const [newlyCreatedScanId, setNewlyCreatedScanId] = React.useState(null);


    React.useEffect(() => {
        setLoading(true);
        const usersQuery = query(collection(db, 'users'), where('role', '==', 'user'));
        const unsubscribeUsers = onSnapshot(usersQuery, (qs) => setPatients(qs.docs.map(d => ({ id: d.id, ...d.data() }))));

        const scansQuery = query(collectionGroup(db, 'scans'));
        const unsubscribeScans = onSnapshot(scansQuery, (qs) => {
            const allScans = qs.docs.map(d => ({ id: d.id, patientId: d.ref.parent.parent.id, ...d.data() }));
            const pending = allScans.filter(s => !s.status || s.status === 'Pending Review');
            const reviewed = allScans.filter(s => s.status && s.status !== 'Pending Review');
            setPendingScans(pending.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
            setStats({ patients: patients.length, reviewed: reviewed.length, pending: pending.length });
            setLoading(false);
        });

        return () => {
            unsubscribeUsers();
            unsubscribeScans();
        };
    }, [patients.length]);

    const handleViewPatientHistory = (patientId) => {
        if (patientId) navigate(`/history`, { state: { patientId } });
    };

    const handlePatientSelectionForHistory = (event) => {
        handleViewPatientHistory(event.target.value);
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setUploadError('');
            setAnalysisResult(null); // Clear previous results
        } else {
            setUploadError('Please select a valid image file.');
        }
    };

    const handleAnalyzeAndUpload = async () => {
        if (!selectedImage || !selectedPatientForUpload) {
            setUploadError('Please select an image and a patient.');
            return;
        }
        setUploading(true);
        setUploadError('');
        setAnalysisResult(null);

        try {
            const patientId = selectedPatientForUpload;
            const storageRef = ref(storage, `scans/${patientId}/${Date.now()}-${selectedImage.name}`);
            await uploadBytes(storageRef, selectedImage);
            const downloadURL = await getDownloadURL(storageRef);

            const analyzeImageFunction = httpsCallable(functions, 'analyzeImageWithGoogle');
            const response = await analyzeImageFunction({ imageUrl: downloadURL });
            const result = response.data;
            
            setAnalysisResult(result);
            setEditedResult(result); // Initialize editing form

            const scansCollectionRef = collection(db, 'users', patientId, 'scans');
            const patientData = patients.find(p => p.id === patientId);
            const docRef = await addDoc(scansCollectionRef, {
                createdAt: serverTimestamp(),
                imageUrl: downloadURL,
                result: result,
                status: 'Reviewed',
                doctorNotes: `Initial AI analysis completed.`,
                patientName: patientData?.displayName || 'Unknown',
            });
            setNewlyCreatedScanId(docRef.id);


        } catch (err) {
            setUploadError(err.message || 'An unexpected error occurred.');
        } finally {
            setUploading(false);
        }
    };

    const handleSaveChanges = async () => {
        if (!editedResult || !newlyCreatedScanId || !selectedPatientForUpload) return;
        
        const scanDocRef = doc(db, 'users', selectedPatientForUpload, 'scans', newlyCreatedScanId);
        try {
            await updateDoc(scanDocRef, {
                result: editedResult,
                doctorNotes: "Doctor has reviewed and updated the AI analysis."
            });
            setAnalysisResult(editedResult); // Update the main display
            setIsEditing(false); // Exit editing mode
            alert("Changes saved successfully!");
        } catch (error) {
            console.error("Error saving changes: ", error);
            alert("Failed to save changes.");
        }
    };

    const resetUploader = () => {
        setSelectedImage(null);
        setPreviewUrl('');
        setSelectedPatientForUpload('');
        setAnalysisResult(null);
        setEditedResult(null);
        setNewlyCreatedScanId(null);
        setIsEditing(false);
    }

    if (loading) return <Box display="flex" justifyContent="center" alignItems="center" height="80vh"><CircularProgress /></Box>;

    return (
        <Container sx={{ py: 8 }}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>Doctor Dashboard</Typography>
            {/* Stats Cards */}
            <Grid container spacing={4} sx={{ mb: 6 }}>
                {/* ... */}
            </Grid>

            {/* Uploader and Analysis Section */}
            <Paper elevation={12} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, mb: 6 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>Upload & Analyze Scan</Typography>
                <Grid container spacing={4} alignItems="stretch">
                    <Grid item xs={12} md={6}>
                        <UploadBox onClick={() => fileInputRef.current.click()}>
                            {previewUrl ? <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: '12px' }} /> : <><CloudUploadIcon sx={{ fontSize: 80, color: 'grey.600', mb: 2 }} /><Typography>Select an image</Typography></>}
                        </UploadBox>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
                    </Grid>
                    <Grid item xs={12} md={6} display="flex" flexDirection="column" justifyContent="space-between">
                        <div>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Select Patient for Upload</InputLabel>
                                <Select value={selectedPatientForUpload} label="Select Patient for Upload" onChange={(e) => setSelectedPatientForUpload(e.target.value)}>
                                    {patients.map((p) => <MenuItem key={p.id} value={p.id}>{p.displayName || p.email}</MenuItem>)}
                                </Select>
                            </FormControl>
                            
                            {uploadError && <Alert severity="error" sx={{ mb: 2 }}>{uploadError}</Alert>}

                            {!analysisResult && (
                                <Button variant="contained" onClick={handleAnalyzeAndUpload} disabled={uploading || !selectedImage || !selectedPatientForUpload} fullWidth size="large" endIcon={<ArrowForwardIcon />} sx={{ mt: 2, py: 1.5 }}>
                                    {uploading ? 'Analyzing...' : 'Run AI Analysis'}
                                </Button>
                            )}
                        </div>

                        {uploading && <Box textAlign="center"><CircularProgress /><Typography>AI is analyzing...</Typography></Box>}
                        
                        {analysisResult && (
                            <ResultCard isMalignant={analysisResult.is_malignant}>
                                <CardContent>
                                    {!isEditing ? (
                                        <>
                                            <Chip label={analysisResult.is_malignant ? "Potential Concern" : "Likely Benign"} color={analysisResult.is_malignant ? "error" : "success"} sx={{ mb: 2, fontWeight: 'bold' }} />
                                            <Typography variant="h5" gutterBottom fontWeight="bold">{analysisResult.disease}</Typography>
                                            <Typography variant="body1" sx={{ mb: 2 }}><strong>Confidence:</strong> {Math.round(analysisResult.confidence * 100)}%</Typography>
                                            <Typography variant="body2" color="text.secondary">{analysisResult.description}</Typography>
                                            <Button startIcon={<EditIcon />} onClick={() => setIsEditing(true)} sx={{mt: 2}}>Edit</Button>
                                        </>
                                    ) : (
                                        <>
                                            <TextField label="Disease / Condition" fullWidth value={editedResult.disease} onChange={(e) => setEditedResult({...editedResult, disease: e.target.value})} sx={{mb: 2}} />
                                            <TextField label="Description / Notes" multiline rows={3} fullWidth value={editedResult.description} onChange={(e) => setEditedResult({...editedResult, description: e.target.value})} sx={{mb: 2}} />
                                            <Button startIcon={<SaveIcon />} variant="contained" onClick={handleSaveChanges}>Save Changes</Button>
                                            <Button onClick={() => setIsEditing(false)} sx={{ml: 1}}>Cancel</Button>
                                        </>
                                    )}
                                </CardContent>
                            </ResultCard>
                        )}
                        {analysisResult && <Button onClick={resetUploader} fullWidth sx={{mt: 2}}>Upload Another Scan</Button>}
                    </Grid>
                </Grid>
            </Paper>

            {/* Patient History and Pending Scans */}
            {/* ... */}
        </Container>
    );
};

export default DoctorDashboard;