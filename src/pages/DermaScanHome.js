import React, { useState, useRef } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  CloudUpload as CloudUploadIcon,
  MedicalInformation as MedicalInformationIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { auth, db, storage, functions } from '../firebase/firebase'; // Make sure to import 'functions'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { useNavigate } from 'react-router-dom';

const UploadBox = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.primary.light}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(4),
  minHeight: 350,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(52, 73, 94, 0.03)',
  textAlign: 'center',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: 'rgba(52, 73, 94, 0.08)',
  },
}));

const ResultCard = styled(Card)(({ theme, isMalignant }) => ({
  backgroundColor: isMalignant ? 'rgba(231, 76, 60, 0.1)' : 'rgba(52, 152, 219, 0.1)',
  borderLeft: `5px solid ${isMalignant ? theme.palette.secondary.main : theme.palette.primary.main}`,
  transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out',
  opacity: 0,
  transform: 'translateY(20px)',
}));

const DermaScanHome = ({ userProfile }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError('');
    } else {
      setError('Please select a valid image file (JPEG, PNG, etc.).');
      setSelectedImage(null);
      setPreviewUrl('');
    }
  };

  const handleAnalyzeClick = async () => {
    if (!auth.currentUser) {
        setError('You must be logged in to perform a scan.');
        navigate('/login');
        return;
    }
    if (!selectedImage) {
      setError('Please upload an image first.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const currentUser = auth.currentUser;
      
      // Step 1: Upload image to Firebase Storage to get a public URL
      const storageRef = ref(storage, `scans/${currentUser.uid}/${Date.now()}-${selectedImage.name}`);
      const uploadTask = await uploadBytes(storageRef, selectedImage);
      const downloadURL = await getDownloadURL(uploadTask.ref);

      // Step 2: Call the Firebase Cloud Function with the image URL
      const analyzeImageFunction = httpsCallable(functions, 'analyzeImageWithGoogle');
      const analysisResponse = await analyzeImageFunction({ imageUrl: downloadURL });
      const analysisResult = analysisResponse.data;
      
      setResult(analysisResult);

      // Step 3: Save the result to Firestore
      const scansCollectionRef = collection(db, 'users', currentUser.uid, 'scans');
      await addDoc(scansCollectionRef, {
        createdAt: serverTimestamp(),
        imageUrl: downloadURL,
        result: analysisResult,
        status: 'Pending Review',
        patientName: currentUser.displayName,
      });

      // Animate result card
      setTimeout(() => {
        const resultCard = document.getElementById('result-card');
        if (resultCard) {
          resultCard.style.opacity = '1';
          resultCard.style.transform = 'translateY(0)';
        }
      }, 100);

    } catch (err) {
      setError(err.message || 'An unexpected error occurred during analysis.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => fileInputRef.current.click();
  
  const steps = ['Upload a clear image', 'AI analyzes the lesion', 'Receive your preliminary result'];

  return (
    <Box>
       <Container component="header" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="center">
          <MedicalInformationIcon color="primary" sx={{ fontSize: 48, mr: 2 }} />
          <Typography variant="h3" component="h1" fontWeight="bold" sx={{ textAlign: 'center' }}>
            Derma<span style={{ color: '#3498db' }}>Scan</span>
          </Typography>
        </Box>
      </Container>
      
      <Container>
        <Box textAlign="center" py={{ xs: 6, md: 8 }}>
          <Chip label="Powered by Google Cloud Vision AI" color="primary" variant="outlined" sx={{ mb: 3 }} />
          <Typography variant="h2" fontWeight="bold" gutterBottom>Instant AI Skin Analysis</Typography>
          <Typography variant="h6" color="text.secondary" maxWidth="md" mx="auto">
            Upload a photo of a skin lesion and our AI will provide an instant, preliminary analysis to help you better understand your skin health.
          </Typography>
        </Box>

        <Box my={{ xs: 6, md: 8 }}>
            <Stepper alternativeLabel activeStep={3}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>
        </Box>
        
        <Paper elevation={12} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <UploadBox onClick={handleUploadClick}>
                {previewUrl ? (
                  <img src={previewUrl} alt="Skin lesion preview" style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: '12px' }} />
                ) : (
                  <>
                    <CloudUploadIcon sx={{ fontSize: 80, color: 'grey.600', mb: 2 }} />
                    <Typography color="text.secondary">Drag & drop an image or click to select</Typography>
                  </>
                )}
              </UploadBox>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>Analysis Report</Typography>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              
              <Box minHeight={200} display="flex" flexDirection="column" justifyContent="center">
                {loading ? (
                  <Box textAlign="center">
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>Google's AI is analyzing your image...</Typography>
                  </Box>
                ) : result ? (
                  <ResultCard id="result-card" isMalignant={result.is_malignant}>
                    <CardContent>
                      <Chip label={result.is_malignant ? "Potential Concern" : "Likely Benign"} color={result.is_malignant ? "secondary" : "primary"} sx={{ mb: 2, fontWeight: 'bold' }} />
                      <Typography variant="h5" component="h3" gutterBottom fontWeight="bold">{result.disease}</Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}><strong>Confidence Score:</strong> {Math.round(result.confidence * 100)}%</Typography>
                      <Typography variant="body2" color="text.secondary">{result.description}</Typography>
                    </CardContent>
                  </ResultCard>
                ) : (
                  <Typography color="text.secondary">Your results will appear here after analysis.</Typography>
                )}
              </Box>
              
              <Button variant="contained" color="primary" onClick={handleAnalyzeClick} disabled={loading || !selectedImage} fullWidth size="large" endIcon={<ArrowForwardIcon />} sx={{ mt: 3, py: 1.5 }}>
                {loading ? 'Analyzing...' : 'Run AI Analysis'}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Alert severity="warning" sx={{ mt: 6 }}>
          <strong>Disclaimer:</strong> DermaScan is an informational AI tool, not a substitute for professional medical advice. Please consult a qualified dermatologist for any health concerns.
        </Alert>

        <Box component="footer" sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            &copy; {new Date().getFullYear()} DermaScan. AI for skin health awareness.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default DermaScanHome;