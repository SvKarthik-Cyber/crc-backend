const Chat = require('../models/Chat');
const { asyncHandler } = require('../middleware/errorHandler');

// Internal staff chat, room-based (see models/Chat.js for the note about
// this not having a frontend consumer yet). REST endpoints below cover
// history; real-time send/receive happens over the socket events registered
// in src/sockets/chat.socket.js.

// GET /api/v1/chats/:room/messages
exports.getRoomHistory = asyncHandler(async (req, res) => {
  const { room } = req.params;
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  const messages = await Chat.find({ room }).sort({ createdAt: -1 }).limit(limit);
  res.status(200).json({ room, count: messages.length, messages: messages.reverse() });
});

// POST /api/v1/chats/:room/messages
// (REST fallback for clients not using the socket connection.)
exports.postRoomMessage = asyncHandler(async (req, res) => {
  const { room } = req.params;
  const { body } = req.body;

  const message = await Chat.create({
    room,
    sender: {
      id: req.user.id,
      name: req.user.name || 'Staff member',
      role: req.user.role,
    },
    body,
  });

  res.status(201).json({ message });
});
