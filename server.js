require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./src/config/db');
const { port, clientOrigin } = require('./src/config/env');
const { initSocket } = require('./src/config/socket');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');

// Route Imports
const authRoutes = require('./src/routes/auth.routes');
const incidentsRoutes = require('./src/routes/incidents.routes');
const adminRoutes = require('./src/routes/admin.routes');
const advisoryRoutes = require('./src/routes/advisories.routes');
const notificationsRoutes = require('./src/routes/notifications.routes');
const messagesRoutes = require('./src/routes/messages.routes');
const chatsRoutes = require('./src/routes/chats.routes');

const app = express();
const server = http.createServer(app);

// Security Middleware
app.use(helmet());

// Dynamic CORS Middleware (Supports Render + Frontend Cloudflare Tunnels)
const allowedOrigins = [clientOrigin, 'http://localhost:5173', 'http://localhost:3000'].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (Postman, curl) or matching origins
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.trycloudflare.com')) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
  })
);

app.use(express.json());

// Database Connection
connectDB();

// Real-time (chat, notifications, staff-ops dashboard) - must be
// initialized before any controller tries to call getIO().
initSocket(server, clientOrigin);

// Root Route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'CRC Cyber Incident Response API is Live' });
});

// Spec-Compliant V1 API Endpoint Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/incidents', incidentsRoutes);
app.use('/api/v1/staff', adminRoutes);
app.use('/api/v1/advisories', advisoryRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/messages', messagesRoutes);
app.use('/api/v1/chats', chatsRoutes);

// Health Check Route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'CRC Backend API Running' });
});

// 404 + centralized error handling - must be registered last, in this order.
app.use(notFound);
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || port || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
