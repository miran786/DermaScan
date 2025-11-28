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
        // Query only users with role 'patient'
        const usersQuery = query(collection(db, 'users'), where('role', '==', 'patient'));

        const unsubscribe = onSnapshot(usersQuery, (querySnapshot) => {
            console.log("PatientContext: Fetching patients...");
            console.log("PatientContext: Found " + querySnapshot.size + " documents.");

            const patientList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log("PatientContext: Patient list:", patientList);
            setPatients(patientList);
            setLoading(false);
        }, (error) => {
            console.error("PatientContext: Error fetching patients:", error);
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
