const Message = require('../models/Message');
const { asyncHandler } = require('../middleware/errorHandler');
const { notifyNewMessage } = require('./notifications.controller');

// POST /api/v1/messages  (staff only)
exports.sendMessage = asyncHandler(async (req, res) => {
  const { recipientId, subject, body } = req.body;

  const message = await Message.create({
    recipient: recipientId,
    sentBy: {
      id: req.user.id,
      name: req.user.name || 'CRC staff',
      role: req.user.role,
    },
    subject,
    body,
  });

  await notifyNewMessage(message);

  res.status(201).json({ message: 'Message sent successfully', data: message });
});

// GET /api/v1/messages/mine  (member)
exports.getMyMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({ recipient: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json({ count: messages.length, messages });
});

// GET /api/v1/messages/:id  (member - own message only)
exports.getMessageById = asyncHandler(async (req, res) => {
  const message = await Message.findOne({ _id: req.params.id, recipient: req.user.id });
  if (!message) {
    return res.status(404).json({ message: 'Message not found.' });
  }

  if (!message.readAt) {
    message.readAt = new Date();
    await message.save();
  }

  res.status(200).json({ message: message });
});
