const mongoose = require('mongoose');

const emailVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: Date
}, {
  timestamps: true
});

// Index for efficient queries
emailVerificationSchema.index({ token: 1 });
emailVerificationSchema.index({ userId: 1 });
emailVerificationSchema.index({ email: 1 });
emailVerificationSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);