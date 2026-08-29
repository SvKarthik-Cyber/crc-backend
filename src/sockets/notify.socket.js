const jwt = require('jsonwebtoken');
const { jwtAccessSecret } = require('../config/env');

// Registers the per-user notification room join. Once a client joins
// `user:<id>`, controllers can target it directly (see
// notifications.controller.js's emitSafely helper) instead of broadcasting
// every notification to every connected client.
function registerNotifySocket(io) {
  io.on('connection', (socket) => {
    socket.on('notify:authenticate', (token) => {
      try {
        const user = jwt.verify(token, jwtAccessSecret);
        socket.join(`user:${user.id}`);
        socket.emit('notify:ready');
      } catch (err) {
        socket.emit('chat:error', { message: 'Notification auth failed: ' + err.message });
      }
    });
  });
}

module.exports = { registerNotifySocket };
