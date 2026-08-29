const express = require('express');
const router = express.Router();
const advisoryController = require('../controllers/advisory.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const canManageAdvisories = authorizeRoles('admin', 'advisory');

// Public route to view published advisories.
router.get('/', advisoryController.getAdvisories);

// Staff: full advisory list (any status) and single-advisory lookup.
router.get('/staff', authenticateToken, canManageAdvisories, advisoryController.getAllAdvisoriesForStaff);
router.get('/:id', authenticateToken, canManageAdvisories, advisoryController.getAdvisoryById);

// Restricted routes for the advisory lifecycle (draft -> publish -> archive).
router.post('/', authenticateToken, canManageAdvisories, advisoryController.createAdvisory);
router.patch('/:id/publish', authenticateToken, canManageAdvisories, advisoryController.publishAdvisory);
router.patch('/:id/archive', authenticateToken, canManageAdvisories, advisoryController.archiveAdvisory);

module.exports = router;
