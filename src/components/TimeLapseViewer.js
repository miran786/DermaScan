import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Slider,
    IconButton,
    Grid,
    Chip,
    Card,
    CardContent,
    Fade
} from '@mui/material';
import {
    PlayArrow as PlayArrowIcon,
    Pause as PauseIcon,
    SkipNext as SkipNextIcon,
    SkipPrevious as SkipPreviousIcon,
    CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const TimeLapseViewer = ({ scans }) => {
    // Ensure scans are sorted chronologically (oldest to newest) for the timeline
    const sortedScans = [...scans].sort((a, b) => {
        const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
        const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
        return timeA - timeB;
    });

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentIndex((prevIndex) => {
                    if (prevIndex < sortedScans.length - 1) {
                        return prevIndex + 1;
                    } else {
                        setIsPlaying(false); // Stop at the end
                        return prevIndex;
                    }
                });
            }, 1500); // Change slide every 1.5 seconds
        }
        return () => clearInterval(interval);
    }, [isPlaying, sortedScans.length]);

    const handleSliderChange = (event, newValue) => {
        setCurrentIndex(newValue);
    };

    const handleNext = () => {
        if (currentIndex < sortedScans.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const togglePlay = () => {
        if (currentIndex === sortedScans.length - 1 && !isPlaying) {
            setCurrentIndex(0); // Restart if at the end
        }
        setIsPlaying(!isPlaying);
    };

    if (sortedScans.length === 0) {
        return <Typography>No scans available for time lapse.</Typography>;
    }

    const currentScan = sortedScans[currentIndex];
    const displayResult = currentScan.isCorrected ? currentScan.correctedResult : currentScan.result;

    return (
        <Box sx={{ width: '100%', mt: 2 }}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2, bgcolor: 'background.default' }}>
                <Grid container spacing={3}>
                    {/* Image Display Area - Taking up most of the width */}
                    <Grid item xs={12} md={9} lg={10}>
                        <Box sx={{ position: 'relative', height: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: 'black', borderRadius: 2, overflow: 'hidden' }}>
                            <Fade in={true} key={currentScan.id} timeout={500}>
                                <img
                                    src={currentScan.imageUrl}
                                    alt={`Scan from ${currentScan.timestamp ? format(currentScan.timestamp.toDate(), 'PP') : 'Unknown Date'}`}
                                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                                />
                            </Fade>

                            {/* Overlay Date */}
                            <Box sx={{ position: 'absolute', top: 16, left: 16, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', px: 2, py: 0.5, borderRadius: 4 }}>
                                <Typography variant="subtitle2" display="flex" alignItems="center">
                                    <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                                    {currentScan.timestamp ? format(currentScan.timestamp.toDate(), 'MMMM dd, yyyy') : 'Date Unknown'}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Controls */}
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <IconButton onClick={togglePlay} color="primary" size="large" sx={{ border: '1px solid', borderColor: 'primary.main' }}>
                                {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                            </IconButton>

                            <Box sx={{ flexGrow: 1, mx: 2 }}>
                                <Slider
                                    value={currentIndex}
                                    min={0}
                                    max={sortedScans.length - 1}
                                    onChange={handleSliderChange}
                                    step={1}
                                    marks
                                    valueLabelDisplay="auto"
                                    valueLabelFormat={(index) => {
                                        const scan = sortedScans[index];
                                        return scan.timestamp ? format(scan.timestamp.toDate(), 'MMM dd') : index + 1;
                                    }}
                                />
                            </Box>

                            <IconButton onClick={handlePrevious} disabled={currentIndex === 0}>
                                <SkipPreviousIcon />
                            </IconButton>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40, textAlign: 'center' }}>
                                {currentIndex + 1} / {sortedScans.length}
                            </Typography>
                            <IconButton onClick={handleNext} disabled={currentIndex === sortedScans.length - 1}>
                                <SkipNextIcon />
                            </IconButton>
                        </Box>
                    </Grid>

                    {/* Info Panel */}
                    <Grid item xs={12} md={3} lg={2}>
                        <Card variant="outlined" sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom fontWeight="bold">
                                    Scan Details
                                </Typography>

                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                        Prediction
                                    </Typography>
                                    <Chip
                                        label={displayResult?.prediction || "Unknown"}
                                        color={displayResult?.severity === 'High' ? "error" : "success"}
                                        variant="filled"
                                        sx={{ fontSize: '1rem', py: 2 }}
                                    />
                                </Box>

                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                        Severity
                                    </Typography>
                                    <Typography variant="body1" fontWeight="500">
                                        {displayResult?.severity || "N/A"}
                                    </Typography>
                                </Box>

                                {currentScan.isCorrected && (
                                    <Box sx={{ mb: 3, p: 1.5, bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 1 }}>
                                        <Typography variant="caption" fontWeight="bold">
                                            Verified by Doctor
                                        </Typography>
                                    </Box>
                                )}

                                {currentScan.doctorNotes && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                            Doctor's Notes
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontStyle: 'italic', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                                            "{currentScan.doctorNotes}"
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default TimeLapseViewer;
