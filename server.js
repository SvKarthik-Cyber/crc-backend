const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./src/config/db');
const { port, clientOrigin } = require('./src/config/env');

// Import Route Handlers
const authRoutes = require('./src/routes/auth.routes');

const app = express();

// Security & Parsing Middleware[cite: 1]
app.use(helmet());
app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);
app.use(express.json());

// Connect to MongoDB[cite: 1]
connectDB();

// API Endpoint Routes[cite: 1]
app.use('/api/auth', authRoutes);

// Server Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'CRC Backend API Running' });
});

// Start Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});