const express = require('express');
const router = express.Router();
const incidentsController = require('../controllers/incidents.controller');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', incidentsController.createIncident);
router.get('/mine', incidentsController.getMyIncidents);
router.get('/:id', incidentsController.getIncidentById);

module.exports = router;