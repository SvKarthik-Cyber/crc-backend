const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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