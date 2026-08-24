const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

// Unprotected Admin Login
router.post('/login', adminController.adminLogin);

// Protected Admin Routes
router.use(authenticateToken);
router.use(authorizeRoles('administrator', 'analyst', 'advisory_manager'));

router.get('/incidents', adminController.getAllIncidents);
router.patch('/incidents/:id', adminController.updateIncidentStatus);

module.exports = router;