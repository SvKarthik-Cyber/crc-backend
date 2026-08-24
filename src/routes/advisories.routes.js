const express = require('express');
const router = express.Router();
const advisoryController = require('../controllers/advisory.controller');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

// Public route to view advisories
router.get('/', advisoryController.getAdvisories);

// Restricted route for publishing advisories
router.post(
  '/',
  authenticateToken,
  authorizeRoles('administrator', 'analyst', 'advisory_manager'),
  advisoryController.createAdvisory
);

module.exports = router;