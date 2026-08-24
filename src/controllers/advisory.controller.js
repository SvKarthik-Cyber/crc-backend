const Advisory = require('../models/Advisory');
const { getIO } = require('../config/socket');

exports.createAdvisory = async (req, res) => {
  try {
    const { title, threatLevel, category, summary, mitigationSteps, affectedSystems } = req.body;

    const advisory = await Advisory.create({
      title,
      threatLevel,
      category,
      summary,
      mitigationSteps: mitigationSteps || [],
      affectedSystems: affectedSystems || [],
      publishedBy: req.user.id,
    });

    // Broadcast new advisory alert to all connected web clients via Socket.io
    try {
      const io = getIO();
      io.emit('new_advisory', advisory);
    } catch (err) {
      console.error('Socket emission warning:', err.message);
    }

    res.status(201).json({ message: 'Advisory published successfully', advisory });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create advisory', error: error.message });
  }
};

exports.getAdvisories = async (req, res) => {
  try {
    const advisories = await Advisory.find({ isPublic: true })
      .populate('publishedBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({ advisories });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch advisories', error: error.message });
  }
};