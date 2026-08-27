const express = require('express');
const router = express.Router();
const advisoryController = require('../controllers/advisory.controller');
// Import both middleware functions from auth.js
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Public route to view advisories
router.get('/', advisoryController.getAdvisories);

// Restricted route for publishing advisories
router.post(
  '/',
  authenticateToken,
  authorizeRoles('administrator', 'analyst', 'advisory_manager', 'admin', 'advisory'),
  advisoryController.createAdvisory
);

module.exports = router;