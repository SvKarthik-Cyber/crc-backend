const mongoose = require('mongoose');

// Staff-facing event log. Matches src/features/notifications/admin/* and
// src/constants/staffNotificationEventTypes.js on the frontend. This is a
// new file (not present in the original scaffold) - it didn't exist at all
// on the backend before, even though the frontend has a full UI for it.
const staffNotificationSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: [
        'INCIDENT_STATUS_CHANGED',
        'INCIDENT_RESPONSE_CREATED',
        'ADVISORY_PUBLISHED',
        'CRC_MESSAGE_CREATED',
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    // Either an ACCOUNT_TYPES value (ORGANIZATION/VOLUNTEER/INDIVIDUAL) or
    // an ADVISORY_AUDIENCES value (ALL_APPROVED_MEMBERS/ACCOUNT_CATEGORIES),
    // matching whatever the frontend passed for `recipientScope`.
    recipientScope: { type: String, required: true },
    relatedReference: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StaffNotification', staffNotificationSchema);
