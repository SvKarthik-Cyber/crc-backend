require('dotenv').config();


const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./src/config/db');
const { port, clientOrigin } = require('./src/config/env');
const { initSocket } = require('./src/config/socket');

// Route Imports
const authRoutes = require('./src/routes/auth.routes');
const incidentsRoutes = require('./src/routes/incidents.routes');
const adminRoutes = require('./src/routes/admin.routes');
const advisoryRoutes = require('./src/routes/advisories.routes');

const app = express();
const server = http.createServer(app);

// Initialize WebSockets
initSocket(server, clientOrigin);

// Security Middleware (Configured to allow viewing uploaded evidence files cross-origin)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS Middleware
app.use(
  cors({
    origin: clientOrigin || '*',
    credentials: true,
  })
);

app.use(express.json());

// Serve Static Uploads Folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
connectDB();

// Root Route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'CRC Cyber Incident Response API is Live' });
});

// API Endpoint Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/advisories', advisoryRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'CRC Backend API Running' });
});

// Start Server (Binds dynamically to Render's PORT or fallback)
const PORT = process.env.PORT || port || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});