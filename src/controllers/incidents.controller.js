const Incident = require('../models/Incident');

exports.createIncident = async (req, res) => {
  try {
    const { category, description, severity, district } = req.body;

    // Map uploaded file paths if files exist in request
    const evidenceFiles = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

    const incident = await Incident.create({
      reportedBy: req.user.id,
      category,
      description,
      evidenceFiles,
      severity,
      district,
      timeline: [{ status: 'new', note: 'Incident reported with evidence', actorId: req.user.id }],
    });

    res.status(201).json({ message: 'Incident submitted successfully', incident });
  } catch (error) {
    res.status(500).json({ message: 'Failed to report incident', error: error.message });
  }
};

exports.getMyIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find({ reportedBy: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ incidents });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch incidents', error: error.message });
  }
};

exports.getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findOne({ _id: req.params.id, reportedBy: req.user.id });
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }
    res.status(200).json({ incident });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving incident', error: error.message });
  }
};

// --- NEW FUNCTIONS FOR ADMIN / VOLUNTEERS ---

// Get all incidents with optional query filters (category, district, severity, status)
exports.getAllIncidents = async (req, res) => {
  try {
    const { category, district, severity, status } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (district) filter.district = district;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;

    const incidents = await Incident.find(filter)
      .populate('reportedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({ count: incidents.length, incidents });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve incidents', error: error.message });
  }
};

// Update incident status and push new state into the timeline array
exports.updateIncidentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const incident = await Incident.findByIdAndUpdate(
      id,
      {
        $set: { status },
        $push: {
          timeline: {
            status,
            note: note || `Status updated to ${status}`,
            actorId: req.user.id,
            at: new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    );

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    res.status(200).json({ message: 'Incident status updated successfully', incident });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update incident status', error: error.message });
  }
};