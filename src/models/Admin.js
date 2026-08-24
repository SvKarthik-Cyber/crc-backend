const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['administrator', 'analyst', 'advisory_manager'],
      required: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    mfaEnabled: { type: Boolean, default: false },
    permissions: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);