const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
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
  usedAt: Date,
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

// Index for efficient queries
passwordResetSchema.index({ token: 1 });
passwordResetSchema.index({ userId: 1 });
passwordResetSchema.index({ email: 1 });
passwordResetSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);