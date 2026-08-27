const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
// Both middleware functions are exported from '../middleware/auth'
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Unprotected Admin Login
router.post('/login', adminController.adminLogin);

// Protected Admin Routes
router.use(authenticateToken);
router.use(authorizeRoles('administrator', 'analyst', 'advisory_manager', 'admin'));

router.get('/incidents', adminController.getAllIncidents);
router.patch('/incidents/:id', adminController.updateIncidentStatus);

module.exports = router;