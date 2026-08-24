const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./src/config/db');
const { port, clientOrigin } = require('./src/config/env');

// Route Imports
const authRoutes = require('./src/routes/auth.routes');
const incidentsRoutes = require('./src/routes/incidents.routes');
const adminRoutes = require('./src/routes/admin.routes');

const app = express();

// Security & Parsing Middleware
app.use(helmet());
app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);
app.use(express.json());

// Database Connection
connectDB();

// API Endpoint Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentsRoutes);
app.use('/api/admin', adminRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'CRC Backend API Running' });
});

// Start Express Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});