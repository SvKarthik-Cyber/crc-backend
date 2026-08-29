const mongoose = require('mongoose');

// One-way staff -> member communications. Matches
// src/features/messages/member/* on the frontend (subject/preview body/
// sentAt via createdAt/readAt).
const messageSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sentBy: {
      id: { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
    },
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Short plain-text preview derived from the body, used by the message list
// view so the client doesn't need to truncate rich text itself.
messageSchema.virtual('preview').get(function preview() {
  const flat = (this.body || '').replace(/\s+/g, ' ').trim();
  return flat.length > 140 ? `${flat.slice(0, 140)}…` : flat;
});
messageSchema.set('toJSON', { virtuals: true });
messageSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Message', messageSchema);
