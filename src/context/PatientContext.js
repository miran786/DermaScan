import React, { createContext, useState, useEffect, useContext } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const PatientContext = createContext();

export const usePatient = () => {
    return useContext(PatientContext);
};

export const PatientProvider = ({ children }) => {
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null); // This will be the full patient object
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const usersQuery = query(collection(db, 'users'), where('role', '==', 'user'));
        
        const unsubscribe = onSnapshot(usersQuery, (querySnapshot) => {
            const patientList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPatients(patientList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching patients:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = {
        patients,
        selectedPatient,
        setSelectedPatient,
        loading,
    };

    return (
        <PatientContext.Provider value={value}>
            {children}
        </PatientContext.Provider>
    );
};
