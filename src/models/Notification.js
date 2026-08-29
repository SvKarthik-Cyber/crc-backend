const mongoose = require('mongoose');

// Member-facing notifications. Matches the frontend's NOTIFICATION_TYPES
// constant (src/constants/notificationTypes.js) and the shape consumed by
// MemberNotificationList / MemberNotificationItem.
const relatedResourceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['INCIDENT', 'ADVISORY', 'MESSAGE'],
      required: true,
    },
    id: { type: String, required: true },
    label: { type: String, required: true },
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['INCIDENT_UPDATE', 'ADVISORY_PUBLISHED', 'CRC_MESSAGE', 'ACCOUNT'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    readAt: { type: Date, default: null },
    relatedResource: { type: relatedResourceSchema, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
