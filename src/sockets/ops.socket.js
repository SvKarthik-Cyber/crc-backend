const jwt = require('jsonwebtoken');
const { jwtAccessSecret } = require('../config/env');

// Registers the shared "staff-ops" room, used to broadcast operational
// events (new incident submitted, advisory published, staff notification
// log entries) to every connected staff dashboard in real time.
function registerOpsSocket(io) {
  io.on('connection', (socket) => {
    socket.on('ops:authenticate', (token) => {
      try {
        const user = jwt.verify(token, jwtAccessSecret);
        const staffRoles = ['admin', 'advisory', 'police', 'volunteer'];
        if (staffRoles.includes(user.role)) {
          socket.join('staff-ops');
          socket.emit('ops:ready');
        }
      } catch (err) {
        socket.emit('chat:error', { message: 'Ops auth failed: ' + err.message });
      }
    });
  });
}

module.exports = { registerOpsSocket };
