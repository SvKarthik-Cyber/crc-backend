const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

// Member: own notifications.
router.get('/mine', notificationsController.getMyNotifications);
router.patch('/:id/read', notificationsController.markNotificationRead);

// Staff: event log (who was notified about what, and why).
router.get(
  '/staff',
  authorizeRoles('admin', 'advisory', 'police', 'volunteer'),
  notificationsController.getStaffNotifications
);

module.exports = router;
