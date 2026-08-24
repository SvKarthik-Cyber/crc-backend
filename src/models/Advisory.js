const mongoose = require('mongoose');

const advisorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    threatLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
    category: { type: String, required: true },
    summary: { type: String, required: true },
    mitigationSteps: [{ type: String }],
    affectedSystems: [{ type: String }],
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Advisory', advisorySchema);