const crypto = require('crypto');
const Incident = require('../models/Incident');
const { asyncHandler } = require('../middleware/errorHandler');
const { getIO } = require('../config/socket');
const { notifyIncidentStatusChange } = require('./notifications.controller');

function emitSafely(event, room, payload) {
  try {
    const io = getIO();
    if (room) io.to(room).emit(event, payload);
    else io.emit(event, payload);
  } catch (err) {
    console.warn(`Socket emission skipped for "${event}":`, err.message);
  }
}

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
exports.createIncident = asyncHandler(async (req, res) => {
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
        updatedBy: { id: req.user.id, name: req.user.name || 'Member', role: req.user.role },
        note: 'Incident reported and reference number assigned.',
      },
    ],
  });

  emitSafely('ops:new_incident', 'staff-ops', incident);

  res.status(201).json({
    message: 'Incident reported successfully.',
    referenceNumber: incident.referenceNumber,
    incident,
  });
});

// 2. Track / Get Incident by Reference Number (Public or Authenticated)
exports.getIncidentByReference = asyncHandler(async (req, res) => {
  const { refNum } = req.params;
  const incident = await Incident.findOne({ referenceNumber: refNum.toUpperCase() }).populate(
    'user',
    'name email mobile'
  );

  if (!incident) {
    return res.status(404).json({ message: 'No incident found with that reference number.' });
  }

  res.status(200).json({ incident });
});

// 3. Get Incidents Submitted by Logged-In User
exports.getMyIncidents = asyncHandler(async (req, res) => {
  const incidents = await Incident.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json({ count: incidents.length, incidents });
});

// 4. Get Specific Incident by MongoDB ID
exports.getIncidentById = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id).populate('user', 'name email mobile');

  if (!incident) {
    return res.status(404).json({ message: 'Incident not found.' });
  }

  const isOwner = incident.user._id.toString() === req.user.id;
  const isStaff = ['admin', 'volunteer', 'police', 'advisory'].includes(req.user.role);

  if (!isOwner && !isStaff) {
    return res.status(403).json({ message: 'Unauthorized to view this incident.' });
  }

  res.status(200).json({ incident });
});

// 5. Get All Incidents (Admin / Volunteer Filters)
exports.getAllIncidents = asyncHandler(async (req, res) => {
  const { status, category, district } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (category) filter.category = category;
  if (district) filter.district = district;

  const incidents = await Incident.find(filter)
    .populate('user', 'name email mobile')
    .sort({ createdAt: -1 });

  res.status(200).json({ count: incidents.length, incidents });
});

// 6. Update Incident Status & Append to Timeline (Admin / Volunteer Only)
exports.updateIncidentStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const { id } = req.params;

  const incident = await Incident.findById(id);
  if (!incident) {
    return res.status(404).json({ message: 'Incident not found.' });
  }

  incident.status = status;
  incident.timeline.push({
    status,
    updatedBy: { id: req.user.id, name: req.user.name || 'Staff member', role: req.user.role },
    note: note || `Status updated to ${status}`,
  });

  await incident.save();

  await notifyIncidentStatusChange(incident);
  emitSafely('ops:incident_updated', 'staff-ops', incident);

  res.status(200).json({
    message: 'Incident status updated successfully.',
    referenceNumber: incident.referenceNumber,
    status: incident.status,
    timeline: incident.timeline,
  });
});
