const mongoose = require('mongoose');

// Internal staff chat rooms. Nothing in the current frontend UI consumes
// this yet (no "chat" references exist anywhere in crc-frontend-main) -
// this is built to a reasonable generic spec (room-based, matches the
// `join_room` socket event already present in src/config/socket.js) so it's
// ready once/if a staff chat UI is added. Confirm the intended UX before
// building that UI so the shape can be adjusted if needed.
const chatMessageSchema = new mongoose.Schema(
  {
    room: { type: String, required: true, index: true },
    sender: {
      id: { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
    },
    body: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Chat', chatMessageSchema);
