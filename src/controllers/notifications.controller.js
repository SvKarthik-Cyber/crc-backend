const Notification = require('../models/Notification');
const StaffNotification = require('../models/StaffNotification');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { getIO } = require('../config/socket');

function emitSafely(event, room, payload) {
  try {
    const io = getIO();
    if (room) {
      io.to(room).emit(event, payload);
    } else {
      io.emit(event, payload);
    }
  } catch (err) {
    console.warn(`Socket emission skipped for "${event}":`, err.message);
  }
}

// --- Internal helpers, used by other controllers (incidents, advisories,
// messages) to raise notifications as a side effect of their own actions.
// Not exposed as HTTP routes themselves. ---

// Creates a member notification for one user + logs a matching staff event.
async function notifyUser({ recipientId, type, title, message, relatedResource }) {
  const notification = await Notification.create({
    recipient: recipientId,
    type,
    title,
    message,
    relatedResource: relatedResource || null,
  });
  emitSafely('new_notification', `user:${recipientId}`, notification);
  return notification;
}

// Fan-out for a published advisory: notify every approved member in the
// advisory's audience, and log one staff event describing the broadcast.
async function createNotificationsForAudience(advisory) {
  const filter = { verificationStatus: 'ACTIVE' };
  if (advisory.audience === 'ACCOUNT_CATEGORIES' && advisory.accountCategories.length > 0) {
    const roleMap = { ORGANIZATION: 'organization', VOLUNTEER: 'volunteer', INDIVIDUAL: 'individual' };
    filter.role = { $in: advisory.accountCategories.map((c) => roleMap[c]).filter(Boolean) };
  }

  const recipients = await User.find(filter).select('_id');
  await Promise.all(
    recipients.map((u) =>
      notifyUser({
        recipientId: u._id,
        type: 'ADVISORY_PUBLISHED',
        title: 'New advisory published',
        message: advisory.title,
        relatedResource: { type: 'ADVISORY', id: advisory._id.toString(), label: advisory.title },
      })
    )
  );

  await logStaffEvent({
    eventType: 'ADVISORY_PUBLISHED',
    title: 'Advisory published',
    message: advisory.title,
    recipientScope: advisory.audience === 'ACCOUNT_CATEGORIES'
      ? advisory.accountCategories.join(', ')
      : 'ALL_APPROVED_MEMBERS',
    relatedReference: advisory._id.toString(),
  });
}

// Notify a single member that one of their incidents changed status.
async function notifyIncidentStatusChange(incident) {
  await notifyUser({
    recipientId: incident.user,
    type: 'INCIDENT_UPDATE',
    title: `Incident ${incident.referenceNumber} status updated`,
    message: `Your incident is now marked as ${incident.status}.`,
    relatedResource: {
      type: 'INCIDENT',
      id: incident._id.toString(),
      label: incident.referenceNumber,
    },
  });

  await logStaffEvent({
    eventType: 'INCIDENT_STATUS_CHANGED',
    title: 'Incident status changed',
    message: `${incident.referenceNumber} moved to ${incident.status}.`,
    recipientScope: 'INDIVIDUAL',
    relatedReference: incident.referenceNumber,
  });
}

// Notify a single member they received a direct CRC message.
async function notifyNewMessage(message) {
  await notifyUser({
    recipientId: message.recipient,
    type: 'CRC_MESSAGE',
    title: 'New message from CRC',
    message: message.subject,
    relatedResource: null,
  });

  await logStaffEvent({
    eventType: 'CRC_MESSAGE_CREATED',
    title: 'Direct message sent',
    message: message.subject,
    recipientScope: 'INDIVIDUAL',
    relatedReference: message._id.toString(),
  });
}

async function logStaffEvent(data) {
  const event = await StaffNotification.create(data);
  emitSafely('new_staff_event', 'staff-ops', event);
  return event;
}

// --- HTTP route handlers ---

// GET /api/v1/notifications/mine
exports.getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user.id }).sort({
    createdAt: -1,
  });
  res.status(200).json({ count: notifications.length, notifications });
});

// PATCH /api/v1/notifications/:id/read
exports.markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user.id,
  });

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found.' });
  }

  if (!notification.readAt) {
    notification.readAt = new Date();
    await notification.save();
  }

  res.status(200).json({ notification });
});

// GET /api/v1/notifications/staff (staff event log)
exports.getStaffNotifications = asyncHandler(async (req, res) => {
  const { eventType } = req.query;
  const filter = {};
  if (eventType) filter.eventType = eventType;

  const events = await StaffNotification.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ count: events.length, events });
});

// Exported for use by other controllers.
exports.notifyUser = notifyUser;
exports.createNotificationsForAudience = createNotificationsForAudience;
exports.notifyIncidentStatusChange = notifyIncidentStatusChange;
exports.notifyNewMessage = notifyNewMessage;
exports.logStaffEvent = logStaffEvent;
