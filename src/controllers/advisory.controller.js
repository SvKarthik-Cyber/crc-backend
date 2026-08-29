const Advisory = require('../models/Advisory');
const { getIO } = require('../config/socket');
const { asyncHandler } = require('../middleware/errorHandler');
const { createNotificationsForAudience } = require('./notifications.controller');

// Safely emit a socket event without ever throwing if socket.io isn't
// initialized (e.g. in tests, or if server.js hasn't started it yet).
function emitSafely(event, payload) {
  try {
    getIO().emit(event, payload);
  } catch (err) {
    console.warn(`Socket emission skipped for "${event}":`, err.message);
  }
}

// Create an advisory. Starts as DRAFT unless the caller explicitly asks to
// publish immediately via `publishImmediately: true`.
exports.createAdvisory = asyncHandler(async (req, res) => {
  const {
    title,
    category,
    summary,
    content,
    threatLevel,
    mitigationSteps,
    affectedSystems,
    audience,
    accountCategories,
    publishImmediately,
  } = req.body;

  const status = publishImmediately ? 'PUBLISHED' : 'DRAFT';

  const advisory = await Advisory.create({
    title,
    category,
    summary,
    content,
    threatLevel: threatLevel || undefined,
    mitigationSteps: mitigationSteps || [],
    affectedSystems: affectedSystems || [],
    audience: audience || 'ALL_APPROVED_MEMBERS',
    accountCategories: accountCategories || [],
    status,
    isPublic: status === 'PUBLISHED',
    publishedBy: {
      id: req.user.id,
      name: req.user.name || 'Staff member',
      role: req.user.role,
    },
  });

  if (status === 'PUBLISHED') {
    await createNotificationsForAudience(advisory);
    emitSafely('new_advisory', advisory);
  }

  res.status(201).json({ message: 'Advisory created successfully', advisory });
});

// Publish a DRAFT advisory: makes it public and notifies its audience.
exports.publishAdvisory = asyncHandler(async (req, res) => {
  const advisory = await Advisory.findById(req.params.id);
  if (!advisory) {
    return res.status(404).json({ message: 'Advisory not found.' });
  }
  if (advisory.status !== 'DRAFT') {
    return res.status(400).json({ message: 'Only draft advisories can be published.' });
  }

  advisory.status = 'PUBLISHED';
  advisory.isPublic = true;
  await advisory.save();

  await createNotificationsForAudience(advisory);
  emitSafely('new_advisory', advisory);

  res.status(200).json({ message: 'Advisory published successfully', advisory });
});

// Archive a PUBLISHED advisory: removes it from the public/member list.
exports.archiveAdvisory = asyncHandler(async (req, res) => {
  const advisory = await Advisory.findById(req.params.id);
  if (!advisory) {
    return res.status(404).json({ message: 'Advisory not found.' });
  }
  if (advisory.status !== 'PUBLISHED') {
    return res.status(400).json({ message: 'Only published advisories can be archived.' });
  }

  advisory.status = 'ARCHIVED';
  advisory.isPublic = false;
  await advisory.save();

  res.status(200).json({ message: 'Advisory archived successfully', advisory });
});

// Public: list published advisories only.
exports.getAdvisories = asyncHandler(async (req, res) => {
  const advisories = await Advisory.find({ status: 'PUBLISHED', isPublic: true }).sort({
    createdAt: -1,
  });

  res.status(200).json({ advisories });
});

// Staff: list every advisory regardless of status, optionally filtered.
exports.getAllAdvisoriesForStaff = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const advisories = await Advisory.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ count: advisories.length, advisories });
});

exports.getAdvisoryById = asyncHandler(async (req, res) => {
  const advisory = await Advisory.findById(req.params.id);
  if (!advisory) {
    return res.status(404).json({ message: 'Advisory not found.' });
  }
  res.status(200).json({ advisory });
});
