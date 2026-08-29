const jwt = require('jsonwebtoken');
const { jwtAccessSecret } = require('../config/env');
const Chat = require('../models/Chat');

// Registers staff-chat events on an already-created socket.io server.
// Call this once from config/socket.js's initSocket().
function registerChatSocket(io) {
  io.on('connection', (socket) => {
    socket.on('chat:join', (room) => {
      socket.join(`chat:${room}`);
    });

    socket.on('chat:message', async ({ room, body, token }) => {
      try {
        const user = jwt.verify(token, jwtAccessSecret);
        const message = await Chat.create({
          room,
          sender: { id: user.id, name: user.name || 'Staff member', role: user.role },
          body,
        });
        io.to(`chat:${room}`).emit('chat:message', message);
      } catch (err) {
        socket.emit('chat:error', { message: 'Could not send message: ' + err.message });
      }
    });
  });
}

module.exports = { registerChatSocket };
