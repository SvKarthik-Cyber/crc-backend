const mongoose = require('mongoose');

// `updatedBy` is a denormalized snapshot rather than a ref, because status
// updates can come from either the `User` collection (staff roles
// admin/volunteer/police/advisory via /api/v1/incidents) or the separate
// `Admin` collection (via /api/v1/staff). A single ObjectId ref can only
// safely `.populate()` one collection, so we capture name/role at write time
// instead. See CRC-integration-audit.md section 3 for the bug this fixes.
const timelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    updatedBy: {
      id: { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const incidentSchema = new mongoose.Schema(
  {
    referenceNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Incident title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Incident description is required'],
    },
    category: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    evidenceFiles: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'],
      default: 'PENDING',
    },
    timeline: [timelineSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Incident', incidentSchema);
