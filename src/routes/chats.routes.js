const express = require('express');
const router = express.Router();
const chatsController = require('../controllers/chats.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Internal staff-only chat.
router.use(authenticateToken);
router.use(authorizeRoles('admin', 'advisory', 'police', 'volunteer'));

router.get('/:room/messages', chatsController.getRoomHistory);
router.post('/:room/messages', chatsController.postRoomMessage);

module.exports = router;
