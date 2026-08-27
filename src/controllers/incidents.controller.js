const crypto = require('crypto');
const Incident = require('../models/Incident');

// Helper to generate a unique 6-character reference number (e.g., CRC-8F2A19)
const generateUniqueReference = async () => {
  let isUnique = false;
  let refNum = '';

  while (!isUnique) {
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    refNum = `CRC-${randomHex}`;

    const existing = await Incident.findOne({ referenceNumber: refNum });
    if (!existing) {
      isUnique = true;
    }
  }

  return refNum;
};

// 1. Create Incident with Reference Number and Evidence File Uploads
exports.createIncident = async (req, res) => {
  try {
    const { title, description, category, district, location } = req.body;

    let evidenceFiles = [];
    if (req.files && req.files.length > 0) {
      evidenceFiles = req.files.map((file) => file.path);
    }

    const referenceNumber = await generateUniqueReference();

    const incident = await Incident.create({
      referenceNumber,
      user: req.user.id,
      title,
      description,
      category,
      district,
      location,
      evidenceFiles,
      status: 'PENDING',
      timeline: [
        {
          status: 'PENDING',
          updatedBy: req.user.id,
          note: 'Incident reported and reference number assigned.',
        },
      ],
    });

    res.status(201).json({
      message: 'Incident reported successfully.',
      referenceNumber: incident.referenceNumber,
      incident,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create incident report', error: error.message });
  }
};

// 2. Track / Get Incident by Reference Number (Public or Authenticated)
exports.getIncidentByReference = async (req, res) => {
  try {
    const { refNum } = req.params;
    const incident = await Incident.findOne({ referenceNumber: refNum.toUpperCase() })
      .populate('user', 'name email mobile')
      .populate('timeline.updatedBy', 'name role');

    if (!incident) {
      return res.status(404).json({ message: 'No incident found with that reference number.' });
    }

    res.status(200).json({ incident });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving incident', error: error.message });
  }
};

// 3. Get Incidents Submitted by Logged-In User
exports.getMyIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ count: incidents.length, incidents });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your incidents', error: error.message });
  }
};

// 4. Get Specific Incident by MongoDB ID
exports.getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('user', 'name email mobile')
      .populate('timeline.updatedBy', 'name role');

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found.' });
    }

    const isOwner = incident.user._id.toString() === req.user.id;
    const isStaff = ['admin', 'volunteer', 'police', 'advisory'].includes(req.user.role);

    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: 'Unauthorized to view this incident.' });
    }

    res.status(200).json({ incident });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching incident details', error: error.message });
  }
};

// 5. Get All Incidents (Admin / Volunteer Filters)
exports.getAllIncidents = async (req, res) => {
  try {
    const { status, category, district } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (district) filter.district = district;

    const incidents = await Incident.find(filter)
      .populate('user', 'name email mobile')
      .sort({ createdAt: -1 });

    res.status(200).json({ count: incidents.length, incidents });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching incidents', error: error.message });
  }
};

// 6. Update Incident Status & Append to Timeline (Admin / Volunteer Only)
exports.updateIncidentStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const { id } = req.params;

    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found.' });
    }

    incident.status = status;
    incident.timeline.push({
      status,
      updatedBy: req.user.id,
      note: note || `Status updated to ${status}`,
    });

    await incident.save();

    res.status(200).json({
      message: 'Incident status updated successfully.',
      referenceNumber: incident.referenceNumber,
      status: incident.status,
      timeline: incident.timeline,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating incident status', error: error.message });
  }
};