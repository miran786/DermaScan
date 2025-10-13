import React from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Chip
} from '@mui/material';
import { Book as BookIcon } from '@mui/icons-material';

// In a real app, this data would come from a CMS or Firestore
const conditions = [
  { id: 1, name: 'Melanoma', type: 'Malignant', summary: 'The most serious type of skin cancer, often developing from moles.' },
  { id: 2, name: 'Basal Cell Carcinoma', type: 'Malignant', summary: 'A common, slow-growing skin cancer that rarely spreads.' },
  { id: 3, name: 'Benign Keratosis (BKL)', type: 'Benign', summary: 'Common, non-cancerous skin growths in older adults.' },
  { id: 4, name: 'Actinic Keratosis', type: 'Pre-cancerous', summary: 'A rough, scaly patch that develops from years of sun exposure.' },
  { id: 5, name: 'Dermatofibroma', type: 'Benign', summary: 'A common, harmless skin nodule that can appear on the legs.' },
  { id: 6, name: 'Vascular Lesion', type: 'Benign', summary: 'Lesions formed by blood vessels, like cherry angiomas.' },
  { id: 7, name: 'Nevus (Mole)', type: 'Benign', summary: 'A common pigmented growth on the skin, usually harmless.' },
];

const getTypeColor = (type) => {
    switch(type) {
        case 'Malignant': return 'error';
        case 'Pre-cancerous': return 'warning';
        case 'Benign':
        default: return 'success';
    }
}

const LibraryPage = () => {
  return (
    <Container sx={{ py: 8 }}>
      <Box display="flex" alignItems="center" justifyContent="center" mb={3}>
        <BookIcon color="primary" sx={{ fontSize: 48, mr: 2 }} />
        <Typography variant="h3" fontWeight="bold" sx={{ textAlign: 'center' }}>
          Skin Condition Library
        </Typography>
      </Box>
      <Typography 
        color="text.secondary" 
        sx={{ 
          mb: 6, 
          textAlign: 'center',
          fontSize: '1.1rem',
          maxWidth: '600px',
          mx: 'auto',
          lineHeight: 1.6
        }}
      >
        Learn more about various skin conditions. This library is for informational purposes only.
      </Typography>

      <Grid container spacing={4}>
        {conditions.map((condition) => (
          <Grid item xs={12} sm={6} md={4} key={condition.id}>
            <Card 
              elevation={8} 
              sx={{ 
                height: '100%',
                transition: 'all 0.3s ease',
                backgroundColor: 'background.paper',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 7px 14px rgba(50, 50, 93, 0.1), 0 3px 6px rgba(0, 0, 0, 0.08)'
                }
              }}
            >
              <CardActionArea sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-start',
                p: 0
              }}>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Chip
                    label={condition.type}
                    color={getTypeColor(condition.type)}
                    size="small"
                    sx={{ 
                      mb: 2, 
                      fontWeight: 'bold',
                      fontSize: '0.75rem'
                    }}
                  />
                  <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: 'text.primary' }}>
                    {condition.name}
                  </Typography>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {condition.summary}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default LibraryPage;
