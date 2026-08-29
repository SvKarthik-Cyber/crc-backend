const mongoose = require('mongoose');

// `publishedBy` is a denormalized snapshot rather than a ref, for the same
// cross-collection reason documented in models/Incident.js: an advisory can
// be published by an `Admin` account or a `User` account with role
// 'admin'/'advisory'.
//
// Fields cover both what the frontend's advisorySchema.js collects
// (title, category, summary, content, audience, accountCategories, status)
// and what the original backend model had (threatLevel, mitigationSteps,
// affectedSystems) - the latter are now optional so creation from the
// current frontend form succeeds without them, while staff can still supply
// them via a fuller form/API client later.
const advisorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    summary: { type: String, required: true, trim: true },
    content: { type: String, required: true },

    threatLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    mitigationSteps: [{ type: String }],
    affectedSystems: [{ type: String }],

    // Matches frontend ADVISORY_AUDIENCES / ACCOUNT_TYPES constants.
    audience: {
      type: String,
      enum: ['ALL_APPROVED_MEMBERS', 'ACCOUNT_CATEGORIES'],
      required: true,
      default: 'ALL_APPROVED_MEMBERS',
    },
    accountCategories: [
      {
        type: String,
        enum: ['ORGANIZATION', 'VOLUNTEER', 'INDIVIDUAL'],
      },
    ],

    // Matches frontend ADVISORY_STATUSES constant. `isPublic` is kept in
    // sync with status (true only when PUBLISHED) for the public GET route.
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
    },
    isPublic: { type: Boolean, default: false },

    publishedBy: {
      id: { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Advisory', advisorySchema);
