const mongoose = require('mongoose');

const twoFactorAuthSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  secret: {
    type: String,
    required: true
  },
  isEnabled: {
    type: Boolean,
    default: false
  },
  backupCodes: [{
    code: String,
    isUsed: {
      type: Boolean,
      default: false
    },
    usedAt: Date
  }],
  lastUsedAt: Date,
  enabledAt: Date
}, {
  timestamps: true
});

// Index for efficient queries
twoFactorAuthSchema.index({ userId: 1 });

module.exports = mongoose.model('TwoFactorAuth', twoFactorAuthSchema);