const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Unprotected Admin Login
router.post('/login', adminController.adminLogin);

// Protected Admin Routes
// NOTE: previously checked for 'administrator' / 'analyst' / 'advisory_manager'
// which are not values that ever exist in either the User or Admin role
// enums, so this effectively only ever matched 'admin' anyway. Fixed to
// reflect that explicitly (see CRC-integration-audit.md section 4).
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.get('/incidents', adminController.getAllIncidents);
router.patch('/incidents/:id', adminController.updateIncidentStatus);

module.exports = router;
