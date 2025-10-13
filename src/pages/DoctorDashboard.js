import React from 'react';
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
  Chip
} from '@mui/material';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import PeopleIcon from '@mui/icons-material/People';
import { collectionGroup, query, where, onSnapshot, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const DoctorDashboard = () => {
  const [pendingScans, setPendingScans] = React.useState([]);
  const [stats, setStats] = React.useState({ patients: 0, reviewed: 0, pending: 0 });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    setLoading(true);

    // Fetch all scans to calculate stats and pending reviews
    const scansQuery = query(collectionGroup(db, 'scans'));

    const unsubscribeScans = onSnapshot(scansQuery, (querySnapshot) => {
      const allScans = [];
      querySnapshot.forEach((doc) => {
        allScans.push({ id: doc.id, patientId: doc.ref.parent.parent.id, ...doc.data() });
      });

      const pending = allScans.filter(scan => !scan.status || scan.status === 'Pending Review');
      const reviewed = allScans.filter(scan => scan.status && scan.status !== 'Pending Review');

      setPendingScans(pending.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
      setStats(prev => ({ ...prev, reviewed: reviewed.length, pending: pending.length }));
      setLoading(false);
    }, (err) => {
      console.error("Error fetching scans:", err);
      setError('Failed to load scan data.');
      setLoading(false);
    });

    // Fetch all patients to get a count
    const usersQuery = query(collection(db, 'users'), where('role', '==', 'user'));
    const unsubscribeUsers = onSnapshot(usersQuery, (querySnapshot) => {
      setStats(prev => ({ ...prev, patients: querySnapshot.size }));
    }, (err) => {
      console.error("Error fetching users:", err);
      setError('Failed to load patient data.');
    });


    return () => {
      unsubscribeScans();
      unsubscribeUsers();
    };
  }, []);

  const handleViewPatientHistory = (patientId) => {
    navigate(`/history`, { state: { patientId } });
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" height="80vh"><CircularProgress /></Box>;
  }

  if (error) {
    return <Container sx={{ mt: 5 }}><Alert severity="error">{error}</Alert></Container>;
  }

  return (
    <Container sx={{ py: 8 }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>Doctor Dashboard</Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PeopleIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="textSecondary">Total Patients</Typography>
                  <Typography variant="h4" component="h2">{stats.patients}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccessTimeIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="textSecondary">Pending Review</Typography>
                  <Typography variant="h4" component="h2">{stats.pending}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TaskAltIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="textSecondary">Total Reviewed</Typography>
                  <Typography variant="h4" component="h2">{stats.reviewed}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Scans Awaiting Review */}
      <Typography variant="h5" fontWeight="bold" gutterBottom>Scans Awaiting Review</Typography>
      <Paper>
        {pendingScans.length === 0 ? (
          <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>No scans are currently pending review. Well done!</Typography>
        ) : (
          <List>
            {pendingScans.map(scan => (
              <ListItem key={scan.id} divider>
                <ListItemAvatar>
                  <Avatar src={scan.imageUrl} variant="rounded">
                    <AssignmentIndIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography fontWeight="bold">{scan.result?.disease || 'Unknown'}</Typography>}
                  secondary={`Submitted ${scan.createdAt ? formatDistanceToNow(scan.createdAt.toDate(), { addSuffix: true }) : 'just now'}`}
                />
                 <Chip
                    label={scan.result?.is_malignant ? "Potential Concern" : "Likely Benign"}
                    color={scan.result?.is_malignant ? "error" : "success"}
                    size="small" sx={{ mx: 2 }}/>
                <Button variant="outlined" onClick={() => handleViewPatientHistory(scan.patientId)}>View Patient History</Button>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default DoctorDashboard;