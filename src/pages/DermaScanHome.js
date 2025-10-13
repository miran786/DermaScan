// src/pages/DermaScanHome.js
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
  StepConnector,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  UploadFile as UploadFileIcon,
  CloudUpload as CloudUploadIcon,
  MedicalInformation as MedicalInformationIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

// --- Styled Components for a Custom Look ---
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
    transform: 'translateY(-2px)',
    boxShadow: '0 7px 14px rgba(50, 50, 93, 0.1), 0 3px 6px rgba(0, 0, 0, 0.08)',
  },
}));

const ResultCard = styled(Card)(({ theme, isMalignant }) => ({
  backgroundColor: isMalignant ? 'rgba(231, 76, 60, 0.1)' : 'rgba(52, 73, 94, 0.1)',
  borderLeft: `5px solid ${isMalignant ? theme.palette.secondary.main : theme.palette.primary.main}`,
  transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out',
  opacity: 0,
  transform: 'translateY(20px)',
}));


// --- Main Component ---
const DermaScanHome = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

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
    if (!selectedImage) {
      setError('Please upload an image first.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockData = {
        disease: 'Benign Keratosis-like Lesions (BKL)',
        confidence: 0.89,
        description: 'This is a common, non-cancerous skin growth. They often appear in middle-aged or older adults and are not a cause for concern.',
        is_malignant: false,
      };
      setResult(mockData);
      // Animate the result card into view
      setTimeout(() => {
        const resultCard = document.getElementById('result-card');
        if (resultCard) {
          resultCard.style.opacity = '1';
          resultCard.style.transform = 'translateY(0)';
        }
      }, 100);

    } catch (err) {
      setError('An unexpected error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => fileInputRef.current.click();
  
  const steps = ['Upload a clear image', 'AI analyzes the lesion', 'Receive your preliminary result'];

  return (
    <Box sx={{
        background: `linear-gradient(135deg, #1e1e2f 0%, #2b2b3d 50%, #1e1e2f 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 20%, rgba(52, 73, 94, 0.08) 0%, transparent 60%), radial-gradient(circle at 70% 80%, rgba(52, 152, 219, 0.08) 0%, transparent 60%)',
          pointerEvents: 'none'
        }
    }}>
      {/* Header */}
      <Container component="header" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="center">
          <MedicalInformationIcon color="primary" sx={{ fontSize: 48, mr: 2 }} />
          <Typography variant="h3" component="h1" fontWeight="bold" sx={{ textAlign: 'center' }}>
            Derma<span style={{ color: '#34495e' }}>Scan</span>
          </Typography>
        </Box>
      </Container>
      
      <Container sx={{ position: 'relative', zIndex: 1 }}>
        {/* Hero Section */}
        <Box textAlign="center" py={{ xs: 6, md: 10 }}>
          <Chip 
            label="Powered by Deep Learning" 
            color="primary" 
            variant="outlined" 
            sx={{ 
              mb: 3, 
              fontWeight: 600,
              px: 2,
              py: 1,
              fontSize: '0.875rem'
            }} 
          />
          <Typography variant="h2" fontWeight="bold" gutterBottom sx={{ color: 'text.primary' }}>
            Instant AI Skin Analysis
          </Typography>
          <Typography variant="h6" color="text.secondary" maxWidth="lg" mx="auto" sx={{ lineHeight: 1.6 }}>
            Upload a photo of a skin lesion and our AI will provide an instant, preliminary analysis to help you better understand your skin health.
          </Typography>
        </Box>

        {/* How It Works Section */}
        <Box my={{ xs: 6, md: 10 }}>
            <Typography variant="h4" textAlign="center" fontWeight="bold" gutterBottom sx={{ mb: 5 }}>
                Simple, Fast, and Insightful
            </Typography>
             <Stepper alternativeLabel activeStep={3} connector={<StepConnector sx={{ top: 22 }} />}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel StepIconProps={{ sx: { fontSize: '2.5rem', color: '#00bcd4 !important' } }}>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>
        </Box>
        
        {/* Main Analysis Area */}
        <Paper elevation={12} sx={{ 
          p: { xs: 3, md: 5 }, 
          borderRadius: 2, 
          background: 'rgba(39, 41, 61, 0.95)', 
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(52, 73, 94, 0.2)',
          boxShadow: '0 7px 14px rgba(50, 50, 93, 0.1), 0 3px 6px rgba(0, 0, 0, 0.08)'
        }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <UploadBox>
                {previewUrl ? (
                  <img src={previewUrl} alt="Skin lesion preview" style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: '12px' }} />
                ) : (
                  <>
                    <CloudUploadIcon sx={{ fontSize: 80, color: 'grey.600', mb: 2 }} />
                    <Typography color="text.secondary">
                      Drag & drop an image or click below
                    </Typography>
                  </>
                )}
              </UploadBox>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
              <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={handleUploadClick} fullWidth sx={{ mt: 2, py: 1.5 }}>
                {previewUrl ? 'Choose Different Image' : 'Upload Image'}
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>Analysis Report</Typography>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              
              <Box minHeight={200} display="flex" flexDirection="column" justifyContent="center">
                {loading ? (
                  <Box textAlign="center">
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>Our AI is analyzing your image...</Typography>
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
              
              <Button variant="contained" color="primary" onClick={handleAnalyzeClick} disabled={loading || !selectedImage} fullWidth size="large" endIcon={<ArrowForwardIcon />} sx={{ mt: 3, py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}>
                {loading ? 'Analyzing...' : 'Run AI Analysis'}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Disclaimer */}
        <Alert 
          severity="warning" 
          sx={{ 
            mt: 8, 
            bgcolor: 'rgba(255, 152, 0, 0.08)', 
            border: '1px solid rgba(255, 152, 0, 0.3)',
            borderRadius: 3,
            '& .MuiAlert-icon': {
              color: 'warning.main'
            }
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            <strong>Disclaimer:</strong> DermaScan is an informational AI tool, not a substitute for professional medical advice. Please consult a qualified dermatologist for any health concerns.
          </Typography>
        </Alert>

        {/* Footer */}
        <Box component="footer" sx={{ py: 8, mt: 8, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            &copy; {new Date().getFullYear()} DermaScan. AI for skin health awareness.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default DermaScanHome;