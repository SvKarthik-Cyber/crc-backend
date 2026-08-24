const { Server } = require('socket.io');

let io;

const initSocket = (server, clientOrigin) => {
  io = new Server(server, {
    cors: {
      origin: clientOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join_room', (room) => {
      socket.join(room);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { initSocket, getIO };