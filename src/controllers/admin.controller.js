const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Incident = require('../models/Incident');
const { generateTokens } = require('../utils/tokens');
const { asyncHandler } = require('../middleware/errorHandler');
const { notifyIncidentStatusChange } = require('./notifications.controller');

exports.adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });

  if (!admin) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  const isMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  const tokens = generateTokens({
    id: admin._id,
    role: admin.role,
    name: admin.name,
    isAdmin: true,
  });

  res.status(200).json({
    message: 'Admin login successful',
    admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    ...tokens,
  });
});

// NOTE: this previously referenced `reportedBy`, `assignedAnalyst`, and
// `severity`, none of which exist on the Incident model (see
// CRC-integration-audit.md section 3) - fixed to use the model's real
// fields (`user`, `category`) and the actor-snapshot `timeline.updatedBy`
// shape from models/Incident.js.
exports.getAllIncidents = asyncHandler(async (req, res) => {
  const { status, category, district } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (category) filter.category = category;
  if (district) filter.district = district;

  const incidents = await Incident.find(filter)
    .populate('user', 'name email mobile role district')
    .sort({ createdAt: -1 });

  res.status(200).json({ count: incidents.length, incidents });
});

exports.updateIncidentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  const incident = await Incident.findById(id);
  if (!incident) {
    return res.status(404).json({ message: 'Incident not found' });
  }

  if (status) incident.status = status;

  incident.timeline.push({
    status: status || incident.status,
    note: note || `Status updated to ${status}`,
    updatedBy: {
      id: req.user.id,
      name: req.user.name || 'Admin',
      role: req.user.role,
    },
  });

  await incident.save();

  await notifyIncidentStatusChange(incident);

  res.status(200).json({ message: 'Incident updated successfully', incident });
});
