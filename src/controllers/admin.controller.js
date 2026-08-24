const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Incident = require('../models/Incident');
const { generateTokens } = require('../utils/tokens');

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const tokens = generateTokens({ id: admin._id, role: admin.role, isAdmin: true });

    res.status(200).json({
      message: 'Admin login successful',
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
      ...tokens,
    });
  } catch (error) {
    res.status(500).json({ message: 'Admin login failed', error: error.message });
  }
};

exports.getAllIncidents = async (req, res) => {
  try {
    const { status, severity, district } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (district) filter.district = district;

    const incidents = await Incident.find(filter)
      .populate('reportedBy', 'name email mobile role district')
      .populate('assignedAnalyst', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({ incidents });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch incidents', error: error.message });
  }
};

exports.updateIncidentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, assignedAnalystId } = req.body;

    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    if (status) incident.status = status;
    if (assignedAnalystId) incident.assignedAnalyst = assignedAnalystId;

    incident.timeline.push({
      status: status || incident.status,
      note: note || `Status updated to ${status}`,
      actorId: req.user.id,
      at: new Date(),
    });

    await incident.save();
    res.status(200).json({ message: 'Incident updated successfully', incident });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update incident', error: error.message });
  }
};