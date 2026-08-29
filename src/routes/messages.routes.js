const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messages.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/mine', messagesController.getMyMessages);
router.get('/:id', messagesController.getMessageById);

router.post(
  '/',
  authorizeRoles('admin', 'advisory', 'police', 'volunteer'),
  messagesController.sendMessage
);

module.exports = router;
