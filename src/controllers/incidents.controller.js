const crypto = require('crypto');
const Incident = require('../models/Incident');

// Generate unique reference number (e.g., CRC-9B4F12)
const generateReferenceNumber = () => {
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `CRC-${randomHex}`;
};

// Create a new incident report with an auto-generated reference number
exports.createIncident = async (req, res) => {
  try {
    const { title, description, category } = req.body;

    let referenceNumber = generateReferenceNumber();
    
    // Ensure reference number uniqueness in case of collision
    let existing = await Incident.findOne({ referenceNumber });
    while (existing) {
      referenceNumber = generateReferenceNumber();
      existing = await Incident.findOne({ referenceNumber });
    }

    const incident = await Incident.create({
      referenceNumber,
      user: req.user.id,
      title,
      description,
      category,
    });

    res.status(201).json({
      message: 'Incident reported successfully.',
      referenceNumber: incident.referenceNumber,
      status: incident.status,
      incident,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit incident report', error: error.message });
  }
};

// Track incident by reference number
exports.getIncidentByReference = async (req, res) => {
  try {
    const { refNum } = req.params;
    const incident = await Incident.findOne({ referenceNumber: refNum.toUpperCase() }).populate(
      'user',
      'name email mobile'
    );

    if (!incident) {
      return res.status(404).json({ message: 'No incident found with that reference number.' });
    }

    res.status(200).json({ incident });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving incident details', error: error.message });
  }
};