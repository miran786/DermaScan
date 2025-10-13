import React, { useState, useEffect } from 'react';
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
  CardMedia,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon, ImageSearch as ImageSearchIcon } from '@mui/icons-material';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { format } from 'date-fns'; // A robust library for date formatting

const ScanHistoryPage = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedScan, setSelectedScan] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const scansCollectionRef = collection(db, 'users', currentUser.uid, 'scans');
      const q = query(scansCollectionRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userScans = [];
        querySnapshot.forEach((doc) => {
          userScans.push({ id: doc.id, ...doc.data() });
        });
        setScans(userScans);
        setLoading(false);
      }, (err) => {
        setError('Failed to fetch scan history.');
        console.error(err);
        setLoading(false);
      });

      return () => unsubscribe(); // Cleanup listener on unmount
    } else {
      setLoading(false);
    }
  }, []);

  const handleViewDetails = (scan) => {
    setSelectedScan(scan);
    setIsDetailOpen(true);
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" sx={{ mt: 10 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Container sx={{ mt: 5 }}><Alert severity="error">{error}</Alert></Container>;
  }

  return (
    <Container sx={{ py: 8 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ color: 'text.primary' }}>
          Your Scan History
        </Typography>
        <Typography color="text.secondary" sx={{ 
          mb: 4,
          fontSize: '1.1rem',
          maxWidth: '600px',
          mx: 'auto',
          lineHeight: 1.6
        }}>
          Here you can review all the analyses you have saved to your account.
        </Typography>
      </Box>

      {scans.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 5, textAlign: 'center', mt: 5 }}>
          <ImageSearchIcon sx={{ fontSize: 60, color: 'grey.500', mb: 2 }}/>
          <Typography variant="h6">No Scans Found</Typography>
          <Typography color="text.secondary">
            Your saved scan results will appear here after you perform an analysis.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={4}>
          {scans.map((scan) => (
            <Grid item xs={12} sm={6} md={4} key={scan.id}>
              <Card 
                elevation={8} 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 7px 14px rgba(50, 50, 93, 0.1), 0 3px 6px rgba(0, 0, 0, 0.08)'
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={scan.imageUrl || 'https://placehold.co/600x400/1e1e1e/e0e0e0?text=Scan'}
                  alt="Scan image"
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'text.primary' }}>
                    {scan.result.disease}
                  </Typography>
                  <Chip
                    label={scan.result.is_malignant ? "Potential Concern" : "Likely Benign"}
                    color={scan.result.is_malignant ? "error" : "success"}
                    size="small"
                    sx={{ 
                      mb: 2, 
                      fontWeight: 'bold',
                      fontSize: '0.75rem'
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                    Scanned on: {scan.createdAt ? format(scan.createdAt.toDate(), 'MMMM d, yyyy') : 'N/A'}
                  </Typography>
                </CardContent>
                <Box sx={{ p: 3, pt: 0 }}>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    onClick={() => handleViewDetails(scan)}
                    sx={{
                      fontWeight: 600,
                      borderColor: 'primary.main',
                      '&:hover': {
                        borderColor: 'primary.dark',
                        backgroundColor: 'primary.main',
                        color: 'white'
                      }
                    }}
                  >
                    View Details
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Detail View Dialog */}
      {selectedScan && (
        <Dialog open={isDetailOpen} onClose={() => setIsDetailOpen(false)} maxWidth="md">
          <DialogTitle>
            Scan Details
            <IconButton onClick={() => setIsDetailOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                 <img src={selectedScan.imageUrl} alt="Scan detail" style={{ width: '100%', borderRadius: '8px' }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h5" fontWeight="bold">{selectedScan.result.disease}</Typography>
                <Chip
                    label={selectedScan.result.is_malignant ? "Potential Concern" : "Likely Benign"}
                    color={selectedScan.result.is_malignant ? "error" : "success"}
                    sx={{ my: 2, fontWeight: 'bold' }}
                  />
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Confidence Score:</strong> {Math.round(selectedScan.result.confidence * 100)}%
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Scan Date:</strong> {selectedScan.createdAt ? format(selectedScan.createdAt.toDate(), 'MMMM d, yyyy, p') : 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedScan.result.description}
                </Typography>
              </Grid>
            </Grid>
          </DialogContent>
        </Dialog>
      )}
    </Container>
  );
};

export default ScanHistoryPage;
