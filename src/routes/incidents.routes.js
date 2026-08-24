const express = require('express');
const router = express.Router();
const incidentsController = require('../controllers/incidents.controller');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Require authentication for all incident routes
router.use(authenticateToken);

// Create incident with optional evidence file uploads (up to 5 files)
router.post('/', upload.array('evidenceFiles', 5), incidentsController.createIncident);

// Get incidents reported by the logged-in user
router.get('/mine', incidentsController.getMyIncidents);

// Get a specific incident by ID for the logged-in user
router.get('/:id', incidentsController.getIncidentById);

module.exports = router;