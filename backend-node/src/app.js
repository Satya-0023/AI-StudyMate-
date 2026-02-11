const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const topicRoutes = require('./routes/topicRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*', // Allow all origins as per Python backend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['*']
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/topics', topicRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ detail: 'Something went wrong!' });
});

module.exports = app;
