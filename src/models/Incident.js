const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    evidenceFiles: [{ type: String }],
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    district: { type: String, required: true },
    status: {
      type: String,
      enum: ['new', 'assigned', 'in_progress', 'closed'],
      default: 'new',
    },
    assignedAnalyst: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    timeline: [
      {
        status: String,
        note: String,
        actorId: mongoose.Schema.Types.ObjectId,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Incident', incidentSchema);