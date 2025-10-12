// src/context/FirebaseDataContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { listenToCollection } from '../services/firebaseServices';
import { CircularProgress, Box, Typography } from '@mui/material';

// 1. Create the context
const FirebaseDataContext = createContext();

// 2. Create the provider component
export const FirebaseDataProvider = ({ children }) => {
  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      // Set up listeners for all major collections
      // These will stay active for the entire user session
      const unsubscribeIssues = listenToCollection('civicIssues', 'reportedAt', setIssues);
      const unsubscribeUsers = listenToCollection('users', 'createdAt', setUsers);
      const unsubscribeDepartments = listenToCollection('departments', 'name', setDepartments);
      const unsubscribeNotifications = listenToCollection('notificationLogs', 'sentAt', setNotifications);

      // Check if data has loaded after a short delay
      const timer = setTimeout(() => {
        if (issues.length > 0 || users.length > 0) { // Check if at least some data is loaded
           setLoading(false);
        }
      }, 1500); // Adjust delay as needed

      // Cleanup function to unsubscribe when the component unmounts
      return () => {
        unsubscribeIssues();
        unsubscribeUsers();
        unsubscribeDepartments();
        unsubscribeNotifications();
        clearTimeout(timer);
      };
    } catch (err) {
      console.error("Failed to initialize Firebase listeners:", err);
      setError("Could not load application data. Please refresh the page.");
      setLoading(false);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // This prevents the app from rendering until essential data is loaded
  if (loading && issues.length === 0 && users.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
        <Typography ml={2}>Initializing Application Data...</Typography>
      </Box>
    );
  }
  
  if (error) {
     return (
       <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography color="error">{error}</Typography>
      </Box>
     );
  }

  // 3. Provide the data to the rest of the app
  const value = {
    issues,
    users,
    departments,
    notifications,
    // You can also provide the service functions here if you want
  };

  return (
    <FirebaseDataContext.Provider value={value}>
      {children}
    </FirebaseDataContext.Provider>
  );
};

// 4. Create a custom hook for easy access to the context
export const useFirebaseData = () => {
  const context = useContext(FirebaseDataContext);
  if (context === undefined) {
    throw new Error('useFirebaseData must be used within a FirebaseDataProvider');
  }
  return context;
};