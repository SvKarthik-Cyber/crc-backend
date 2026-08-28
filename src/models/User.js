const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['organization', 'volunteer', 'individual', 'admin', 'advisory', 'police'],
      required: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    mobile: { type: String, required: true },
    passwordHash: { type: String, required: true },
    district: { type: String, required: true },
    
    // Multi-Step Verification Pipeline
    isVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: [
        'NOT_REQUIRED',
        'PENDING_ADVISORY',
        'PENDING_POLICE_VERIFICATION',
        'APPROVED_TEMPORARY',
        'ACTIVE',
        'REJECTED'
      ],
      default: 'NOT_REQUIRED'
    },
    mustChangePassword: { type: Boolean, default: false },

    // Role-specific embedded profiles
    orgProfile: {
      orgType: String,
      sector: String,
      contactPerson: String,
      designation: String,
      address: String,
    },
    volunteerProfile: {
      occupation: String,
      skills: [String],
      certifications: [String],
      availability: String,
    },
    individualProfile: {
      occupation: String,
      cvUrl: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);