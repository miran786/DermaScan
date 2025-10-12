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
    <Container sx={{ py: 5 }}>
      <Box display="flex" alignItems="center" mb={1}>
        <BookIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
        <Typography variant="h3" fontWeight="bold">
          Skin Condition Library
        </Typography>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 5 }}>
        Learn more about various skin conditions. This library is for informational purposes only.
      </Typography>

      <Grid container spacing={4}>
        {conditions.map((condition) => (
          <Grid item xs={12} sm={6} md={4} key={condition.id}>
            <Card elevation={8} sx={{ height: '100%' }}>
              <CardActionArea sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Chip
                    label={condition.type}
                    color={getTypeColor(condition.type)}
                    size="small"
                    sx={{ mb: 2, fontWeight: 'bold' }}
                  />
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {condition.name}
                  </Typography>
                  <Typography color="text.secondary">
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
