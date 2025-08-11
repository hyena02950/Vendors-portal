const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    deviceId: String
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  revokedAt: Date,
  revokedReason: String,
  lastUsedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ token: 1 });
refreshTokenSchema.index({ expiresAt: 1 });
refreshTokenSchema.index({ isRevoked: 1 });

// Clean up expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);