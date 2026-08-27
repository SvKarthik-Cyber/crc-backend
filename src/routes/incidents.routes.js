const express = require('express');
const router = express.Router();
const incidentsController = require('../controllers/incidents.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public tracking route
router.get('/track/:refNum', incidentsController.getIncidentByReference);

// Authenticated user routes
router.use(authenticateToken);

router.post('/', upload.array('evidenceFiles', 5), incidentsController.createIncident);
router.get('/mine', incidentsController.getMyIncidents);
router.get('/:id', incidentsController.getIncidentById);

// Protected Staff routes
router.get('/', authorizeRoles('admin', 'volunteer', 'police'), incidentsController.getAllIncidents);
router.patch(
  '/:id/status',
  authorizeRoles('admin', 'volunteer', 'police'),
  incidentsController.updateIncidentStatus
);

module.exports = router;