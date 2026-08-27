const mongoose = require('mongoose');

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
    status: {
      type: String,
      enum: ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'],
      default: 'PENDING',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Incident', incidentSchema);