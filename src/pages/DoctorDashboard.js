import React, { useState, useEffect } from 'react';
import {
    Container, Box, Typography, Grid, Paper, CircularProgress, List, ListItem, ListItemText, Avatar, ListItemAvatar, Button, FormControl, InputLabel, Select, MenuItem, Card, CardContent, CardActions, Divider, Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { ArrowForward as ArrowForwardIcon, FileUpload as FileUploadIcon } from '@mui/icons-material';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import PeopleIcon from '@mui/icons-material/People';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { usePatient } from '../context/PatientContext'; // Import the context hook

const StatCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    height: '100%',
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    borderRadius: theme.shape.borderRadius * 2,
    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
    '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: theme.shadows[10],
    }
}));

const DoctorDashboard = () => {
    const { patients, setSelectedPatient } = usePatient();
    const [pendingScans, setPendingScans] = useState([]);
    const [stats, setStats] = useState({ reviewed: 0, pending: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Add error state
    const navigate = useNavigate();
    const doctorName = auth.currentUser?.displayName || auth.currentUser?.email || '';

    useEffect(() => {
        // This check ensures we don't try to process scans before the patient list is loaded.
        if (patients.length === 0 && loading) {
            // Still waiting for patient data from context
            return;
        }

        // Use simple collection query to avoid index issues with collectionGroup
        const scansQuery = query(collection(db, 'scans'));

        const unsubscribeScans = onSnapshot(scansQuery, (querySnapshot) => {
            const allScans = querySnapshot.docs.map(doc => ({
                id: doc.id,
                patientId: doc.data().userId, // Fix: Use userId from data, not parent path
                ...doc.data()
            }));

            console.log("DoctorDashboard: Fetched " + allScans.length + " total scans.");

            const pending = allScans.filter(scan => !scan.status || scan.status === 'Pending Review');
            const reviewed = allScans.filter(scan => scan.status && scan.status !== 'Pending Review');

            console.log("DoctorDashboard: Pending scans:", pending.length);
            console.log("DoctorDashboard: Reviewed scans:", reviewed.length);

            const pendingWithPatientInfo = pending.map(scan => {
                const patientInfo = patients.find(p => p.id === scan.patientId);
                return { ...scan, patientName: patientInfo?.displayName || patientInfo?.email || 'Unknown' };
            }).sort((a, b) => {
                const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
                const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
                return timeB - timeA;
            });

            console.log("DoctorDashboard: Pending with info:", pendingWithPatientInfo);

            setPendingScans(pendingWithPatientInfo);
            setStats({ reviewed: reviewed.length, pending: pending.length });
            setLoading(false);
        }, (err) => {
            console.error("DoctorDashboard: Error fetching scans:", err);
            setError("Failed to load scans. " + err.message);
            setLoading(false);
        });

        return () => unsubscribeScans();
    }, [patients, loading]); // Re-run when patients list is available or loading state changes

    const handlePatientSelectAndNavigate = (patientId) => {
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
            setSelectedPatient(patient); // Set the global context
            navigate(`/history`);
        }
    };

    if (loading) {
        return <Box display="flex" justifyContent="center" alignItems="center" height="80vh"><CircularProgress /></Box>;
    }

    return (
        <Container sx={{ py: 6 }}>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                Welcome back, Dr. {doctorName.split('@')[0]}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
                Here's a summary of your clinic's activity.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

            <Grid container spacing={4} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}><StatCard elevation={4}>
                    <PeopleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h3" fontWeight="bold">{patients.length}</Typography>
                    <Typography variant="h6" color="text.secondary">Total Patients</Typography>
                </StatCard></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard elevation={4}>
                    <AccessTimeIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h3" fontWeight="bold">{stats.pending}</Typography>
                    <Typography variant="h6" color="text.secondary">Pending Reviews</Typography>
                </StatCard></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard elevation={4}>
                    <TaskAltIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h3" fontWeight="bold">{stats.reviewed}</Typography>
                    <Typography variant="h6" color="text.secondary">Reviewed Scans</Typography>
                </StatCard></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard elevation={4} sx={{ backgroundColor: 'primary.main', color: 'white' }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Quick Actions</Typography>
                    <Button variant="contained" color="inherit" startIcon={<FileUploadIcon />} onClick={() => navigate('/upload')} sx={{ backgroundColor: 'white', color: 'primary.main', '&:hover': { backgroundColor: 'grey.200' } }}>
                        Upload New Scan
                    </Button>
                </StatCard></Grid>
            </Grid>

            <Grid container spacing={4}>
                <Grid item xs={12} md={8}><Paper elevation={4} sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>Pending Reviews</Typography>
                    <Divider sx={{ mb: 2 }} />
                    {pendingScans.length > 0 ? (
                        <List>{pendingScans.map((scan) => (
                            <ListItem key={scan.id} secondaryAction={
                                <Button edge="end" variant="outlined" onClick={() => handlePatientSelectAndNavigate(scan.patientId)} endIcon={<ArrowForwardIcon />}>Review</Button>
                            } sx={{ mb: 1, borderRadius: 1, '&:hover': { backgroundColor: 'action.hover' } }}>
                                <ListItemAvatar><Avatar src={scan.imageUrl} variant="rounded"><AssignmentIndIcon /></Avatar></ListItemAvatar>
                                <ListItemText primary={<Typography variant="body1" fontWeight="500">{scan.patientName}</Typography>} secondary={scan.timestamp ? `Submitted ${formatDistanceToNow(scan.timestamp.toDate(), { addSuffix: true })}` : 'Date unknown'} />
                            </ListItem>
                        ))}</List>
                    ) : (
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>All caught up! No scans are pending review.</Typography>
                    )}
                </Paper></Grid>
                <Grid item xs={12} md={4}><Card elevation={4} sx={{ borderRadius: 2, height: '100%' }}>
                    <CardContent>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>Patient Directory</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Quickly access a patient's complete scan history.</Typography>
                        <FormControl fullWidth>
                            <InputLabel>Select a Patient to View History</InputLabel>
                            <Select defaultValue="" label="Select a Patient to View History" onChange={(e) => handlePatientSelectAndNavigate(e.target.value)}>
                                {patients.map((patient) => (
                                    <MenuItem key={patient.id} value={patient.id}>{patient.displayName || patient.email}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'center', p: 2 }}>
                        <Button fullWidth variant="contained" startIcon={<FileUploadIcon />} onClick={() => navigate('/upload')}>Upload for a Patient</Button>
                    </CardActions>
                </Card></Grid>
            </Grid>
        </Container>
    );
};

export default DoctorDashboard;
