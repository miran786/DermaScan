// src/pages/Dashboard.js - REFACTORED & FIXED
import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Avatar,
  Alert
} from '@mui/material';
import {
  ReportProblem as IssuesIcon,
  CheckCircle as ResolvedIcon,
  HourglassEmpty as PendingIcon,
  TrendingUp as TrendIcon,
  LocationOn as LocationOnIcon, // FIX: Icon is now imported
  Person as PersonIcon,
  Group as UsersIcon,
} from '@mui/icons-material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer
} from 'recharts';
// Import the custom hook to get data
import { useFirebaseData } from '../context/FirebaseDataContext';

const Dashboard = () => {
  // Get all necessary data from the global context with one line!
  const { issues, users } = useFirebaseData();

  // --- All calculations below are now derived from the context data ---

  // Calculate current statistics
  const totalIssues = issues.length;
  const resolvedIssues = issues.filter(issue => issue.status === 'Resolved').length;
  const openIssues = issues.filter(issue => issue.status === 'Open').length;
  const inProgressIssues = issues.filter(issue => issue.status === 'In Progress').length;
  
  // User statistics
  const totalUsers = users.length;
  const mobileUsers = users.filter(user => user.source === 'mobile_app').length;
  const adminUsers = users.filter(user => user.role === 'admin').length;
  
  // Chart data
  const statusData = [
    { name: 'Open', value: openIssues, color: '#f44336' },
    { name: 'In Progress', value: inProgressIssues, color: '#ff9800' },
    { name: 'Resolved', value: resolvedIssues, color: '#4caf50' },
  ].filter(item => item.value > 0);

  const categoryData = issues.reduce((acc, issue) => {
    const category = issue.category || 'Other';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
  
  const categoryChartData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));
  
  // --- UI Components ---

  const StatCard = ({ title, value, icon, color }) => (
    <Card elevation={3}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h3" component="h2" sx={{ color: color, fontWeight: 'bold' }}>
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return '#f44336';
      case 'In Progress': return '#ff9800';
      case 'Resolved': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        🏛️ JanSahyog Dashboard
      </Typography>
      
      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Total Issues" value={totalIssues} icon={<IssuesIcon />} color="#1976d2" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Open Issues" value={openIssues} icon={<PendingIcon />} color="#f44336" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="In Progress" value={inProgressIssues} icon={<TrendIcon />} color="#ff9800" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Resolved" value={resolvedIssues} icon={<ResolvedIcon />} color="#4caf50" /></Grid>
        <Grid item xs={12} sm={6} md={4}><StatCard title="Total Users" value={totalUsers} icon={<UsersIcon />} color="#9c27b0" /></Grid>
        <Grid item xs={12} sm={6} md={4}><StatCard title="Mobile Users" value={mobileUsers} icon={<PersonIcon />} color="#00bcd4" /></Grid>
        <Grid item xs={12} sm={6} md={4}><StatCard title="Admin Users" value={adminUsers} icon={<PersonIcon />} color="#ff5722" /></Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: 350 }}>
            <Typography variant="h6" gutterBottom>Issue Status</Typography>
            {statusData.length > 0 ? (
              <ResponsiveContainer><PieChart><Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} label>{statusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer>
            ) : <Alert severity="info">No issue status data to display.</Alert>}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: 350 }}>
            <Typography variant="h6" gutterBottom>Issue Categories</Typography>
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer><BarChart data={categoryChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#1976d2" /></BarChart></ResponsiveContainer>
            ) : <Alert severity="info">No issue category data to display.</Alert>}
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Issues */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Recent Issues</Typography>
        {issues.length > 0 ? (
          <List>
            {issues.slice(0, 5).map((issue) => (
              <ListItem key={issue.id} divider>
                <ListItemText
                  primary={<Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{issue.title || 'Untitled Issue'}</Typography>}
                  secondary={
                    <>
                      <Chip label={issue.status || 'Unknown'} size="small" sx={{ bgcolor: getStatusColor(issue.status), color: 'white', mr: 1 }} />
                      <Chip label={issue.category || 'Other'} size="small" color="primary" variant="outlined" />
                      <Typography variant="body2" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                        <LocationOnIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                        {issue.location?.address || 'Location unknown'}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Alert severity="success">No issues reported yet. Everything looks good! 🎉</Alert>
        )}
      </Paper>
    </Box>
  );
};

export default Dashboard;