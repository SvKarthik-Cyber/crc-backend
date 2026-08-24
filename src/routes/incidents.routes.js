const express = require('express');
const router = express.Router();
const incidentsController = require('../controllers/incidents.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Require authentication for all incident routes
router.use(authenticateToken);

// --- USER ROUTES ---

// Create incident with optional evidence file uploads (up to 5 files)
router.post('/', upload.array('evidenceFiles', 5), incidentsController.createIncident);

// Get incidents reported by the logged-in user
router.get('/mine', incidentsController.getMyIncidents);

// Get a specific incident by ID for the logged-in user
router.get('/:id', incidentsController.getIncidentById);

// --- ADMIN / VOLUNTEER ROUTES ---

// Get all incidents with optional query filters (Admin/Volunteer only)
router.get('/', authorizeRoles('admin', 'volunteer'), incidentsController.getAllIncidents);

// Update incident status and append to timeline (Admin/Volunteer only)
router.patch('/:id/status', authorizeRoles('admin', 'volunteer'), incidentsController.updateIncidentStatus);

module.exports = router;