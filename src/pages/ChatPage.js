import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Divider,
    TextField,
    IconButton,
    Container,
    Badge
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import { db } from '../firebase/firebase';
import {
    collection,
    query,
    onSnapshot,
    orderBy,
    addDoc,
    doc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { format } from 'date-fns';
import { usePatient } from '../context/PatientContext';

const ChatPage = ({ userProfile }) => {
    const { patients } = usePatient();
    const [conversations, setConversations] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    const DOCTOR_ID = "doctor_admin_01";

    // 1. Fetch Conversations List (Real-time)
    useEffect(() => {
        const q = query(collection(db, 'conversations'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const convs = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                // Filter: Must be in the patients list AND not the current user
                .filter(chat => {
                    const isPatient = patients.some(p => p.id === chat.id);
                    const isNotSelf = chat.id !== userProfile?.uid;
                    return isPatient && isNotSelf;
                });

            setConversations(convs);
        });

        return () => unsubscribe();
    }, [userProfile, patients]);

    // 2. Fetch Messages for Selected Chat (Real-time)
    useEffect(() => {
        if (!selectedChat) return;

        const q = query(
            collection(db, 'conversations', selectedChat.id, 'messages'),
            orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
            scrollToBottom();
        });

        return () => unsubscribe();
    }, [selectedChat]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async () => {
        if (newMessage.trim() === '' || !selectedChat) return;

        try {
            // Add message to sub-collection
            await addDoc(collection(db, 'conversations', selectedChat.id, 'messages'), {
                text: newMessage,
                senderId: DOCTOR_ID,
                timestamp: serverTimestamp()
            });

            // Update parent conversation with last message
            await updateDoc(doc(db, 'conversations', selectedChat.id), {
                lastMessage: newMessage,
                timestamp: serverTimestamp()
            });

            setNewMessage('');
        } catch (error) {
            console.error("Error sending message: ", error);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4, height: '85vh' }}>
            <Paper elevation={3} sx={{ height: '100%', display: 'flex', overflow: 'hidden', borderRadius: 4 }}>
                <Grid container sx={{ height: '100%' }}>
                    {/* Sidebar - Conversation List */}
                    <Grid item xs={12} md={4} sx={{ borderRight: '1px solid #e0e0e0', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                            <Typography variant="h6" fontWeight="bold">Conversations</Typography>
                        </Box>
                        <List sx={{ overflowY: 'auto', flexGrow: 1, p: 0 }}>
                            {conversations.map((chat) => (
                                <React.Fragment key={chat.id}>
                                    <ListItem
                                        button
                                        selected={selectedChat?.id === chat.id}
                                        onClick={() => setSelectedChat(chat)}
                                        sx={{
                                            '&.Mui-selected': {
                                                bgcolor: 'action.selected',
                                                borderLeft: '4px solid',
                                                borderColor: 'primary.main'
                                            },
                                            py: 2
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                                <PersonIcon />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {chat.patientName || "Unknown Patient"}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="body2" color="text.secondary" noWrap>
                                                    {chat.lastMessage || "No messages yet"}
                                                </Typography>
                                            }
                                        />
                                        {chat.timestamp && (
                                            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                                                {format(chat.timestamp.toDate(), 'MMM dd')}
                                            </Typography>
                                        )}
                                    </ListItem>
                                    <Divider component="li" />
                                </React.Fragment>
                            ))}
                            {conversations.length === 0 && (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">No active conversations.</Typography>
                                </Box>
                            )}
                        </List>
                    </Grid>

                    {/* Chat Area */}
                    <Grid item xs={12} md={8} sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f5f7fa' }}>
                        {selectedChat ? (
                            <>
                                {/* Chat Header */}
                                <Box sx={{ p: 2, bgcolor: 'white', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center' }}>
                                    <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}><PersonIcon /></Avatar>
                                    <Typography variant="h6">{selectedChat.patientName}</Typography>
                                </Box>

                                {/* Messages List */}
                                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {messages.map((msg) => {
                                        const isMe = msg.senderId === DOCTOR_ID;
                                        return (
                                            <Box
                                                key={msg.id}
                                                sx={{
                                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                                    maxWidth: '70%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: isMe ? 'flex-end' : 'flex-start'
                                                }}
                                            >
                                                <Paper
                                                    elevation={1}
                                                    sx={{
                                                        p: 2,
                                                        bgcolor: isMe ? 'primary.main' : 'white',
                                                        color: isMe ? 'white' : 'text.primary',
                                                        borderRadius: 2,
                                                        borderTopRightRadius: isMe ? 0 : 2,
                                                        borderTopLeftRadius: isMe ? 2 : 0
                                                    }}
                                                >
                                                    <Typography variant="body1">{msg.text}</Typography>
                                                </Paper>
                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, px: 1 }}>
                                                    {msg.timestamp ? format(msg.timestamp.toDate(), 'p') : 'Sending...'}
                                                </Typography>
                                            </Box>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </Box>

                                {/* Input Area */}
                                <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #e0e0e0' }}>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <TextField
                                            fullWidth
                                            placeholder="Type a message..."
                                            variant="outlined"
                                            size="small"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            sx={{ bgcolor: '#f5f7fa' }}
                                        />
                                        <IconButton color="primary" onClick={handleSendMessage} disabled={!newMessage.trim()}>
                                            <SendIcon />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </>
                        ) : (
                            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'text.secondary' }}>
                                <Typography variant="h5" gutterBottom>Select a conversation</Typography>
                                <Typography variant="body1">Choose a patient from the list to start chatting.</Typography>
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    );
};

export default ChatPage;
