const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const EmailVerification = require('../models/EmailVerification');
const PasswordReset = require('../models/PasswordReset');
const TwoFactorAuth = require('../models/TwoFactorAuth');
const AppError = require('../utils/AppError');

class AuthService {
  // Generate access token
  generateAccessToken(userId, tokenVersion = 0) {
    return jwt.sign(
      { 
        userId, 
        tokenVersion,
        type: 'access'
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '15m' }
    );
  }

  // Generate refresh token
  async generateRefreshToken(userId, deviceInfo = {}) {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const refreshToken = new RefreshToken({
      token,
      userId,
      deviceInfo,
      expiresAt
    });

    await refreshToken.save();
    return token;
  }

  // Verify and rotate refresh token
  async refreshAccessToken(refreshTokenString, deviceInfo = {}) {
    const refreshToken = await RefreshToken.findOne({
      token: refreshTokenString,
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    }).populate('userId');

    if (!refreshToken) {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    const user = refreshToken.userId;
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401, 'USER_INACTIVE');
    }

    // Update last used time
    refreshToken.lastUsedAt = new Date();
    await refreshToken.save();

    // Generate new access token
    const accessToken = this.generateAccessToken(user._id, user.tokenVersion || 0);

    // Optionally rotate refresh token for enhanced security
    let newRefreshToken = refreshTokenString;
    if (this.shouldRotateRefreshToken(refreshToken)) {
      // Revoke old token
      refreshToken.isRevoked = true;
      refreshToken.revokedAt = new Date();
      refreshToken.revokedReason = 'Token rotation';
      await refreshToken.save();

      // Generate new refresh token
      newRefreshToken = await this.generateRefreshToken(user._id, deviceInfo);
    }

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        roles: user.roles,
        profile: user.profile
      }
    };
  }

  // Determine if refresh token should be rotated
  shouldRotateRefreshToken(refreshToken) {
    const daysSinceCreation = (new Date() - refreshToken.createdAt) / (1000 * 60 * 60 * 24);
    return daysSinceCreation > 1; // Rotate after 1 day
  }

  // Revoke refresh token
  async revokeRefreshToken(refreshTokenString, reason = 'Manual revocation') {
    const refreshToken = await RefreshToken.findOne({ token: refreshTokenString });
    
    if (refreshToken && !refreshToken.isRevoked) {
      refreshToken.isRevoked = true;
      refreshToken.revokedAt = new Date();
      refreshToken.revokedReason = reason;
      await refreshToken.save();
    }
  }

  // Revoke all user tokens (for logout all devices)
  async revokeAllUserTokens(userId, reason = 'Logout all devices') {
    await RefreshToken.updateMany(
      { userId, isRevoked: false },
      { 
        isRevoked: true, 
        revokedAt: new Date(),
        revokedReason: reason
      }
    );

    // Increment token version to invalidate all access tokens
    await User.findByIdAndUpdate(userId, { 
      $inc: { tokenVersion: 1 } 
    });
  }

  // Generate email verification token
  async generateEmailVerificationToken(userId, email) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    // Remove any existing verification tokens for this user
    await EmailVerification.deleteMany({ userId });

    const verification = new EmailVerification({
      userId,
      token,
      email,
      expiresAt
    });

    await verification.save();
    return token;
  }

  // Verify email token
  async verifyEmailToken(token) {
    const verification = await EmailVerification.findOne({
      token,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!verification) {
      throw new AppError('Invalid or expired verification token', 400, 'INVALID_VERIFICATION_TOKEN');
    }

    // Mark as used
    verification.isUsed = true;
    verification.usedAt = new Date();
    await verification.save();

    // Update user email verification status
    await User.findByIdAndUpdate(verification.userId, {
      emailVerified: true
    });

    return verification.userId;
  }

  // Generate password reset token
  async generatePasswordResetToken(email, ipAddress, userAgent) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists
      return null;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

    // Remove any existing reset tokens for this user
    await PasswordReset.deleteMany({ userId: user._id });

    const passwordReset = new PasswordReset({
      userId: user._id,
      token,
      email,
      expiresAt,
      ipAddress,
      userAgent
    });

    await passwordReset.save();
    return { token, user };
  }

  // Verify password reset token
  async verifyPasswordResetToken(token) {
    const passwordReset = await PasswordReset.findOne({
      token,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    }).populate('userId');

    if (!passwordReset) {
      throw new AppError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
    }

    return passwordReset;
  }

  // Reset password using token
  async resetPassword(token, newPassword) {
    const passwordReset = await this.verifyPasswordResetToken(token);
    const user = passwordReset.userId;

    // Update password
    user.password = newPassword;
    await user.save();

    // Mark reset token as used
    passwordReset.isUsed = true;
    passwordReset.usedAt = new Date();
    await passwordReset.save();

    // Revoke all existing refresh tokens for security
    await this.revokeAllUserTokens(user._id, 'Password reset');

    return user;
  }

  // Setup 2FA for user
  async setup2FA(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Check if user role requires 2FA
    const requiresTwoFA = user.roles.some(role => 
      ['elika_admin', 'finance_team'].includes(role.role)
    );

    const secret = speakeasy.generateSecret({
      name: `Elika Vendor Portal (${user.email})`,
      issuer: 'Elika Vendor Portal'
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => ({
      code: crypto.randomBytes(4).toString('hex').toUpperCase(),
      isUsed: false
    }));

    // Save 2FA settings (but don't enable yet)
    await TwoFactorAuth.findOneAndUpdate(
      { userId },
      {
        secret: secret.base32,
        backupCodes,
        isEnabled: false
      },
      { upsert: true }
    );

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url,
      backupCodes: backupCodes.map(bc => bc.code),
      required: requiresTwoFA
    };
  }

  // Enable 2FA after verification
  async enable2FA(userId, token) {
    const twoFA = await TwoFactorAuth.findOne({ userId });
    if (!twoFA) {
      throw new AppError('2FA not set up', 400, 'TWO_FA_NOT_SETUP');
    }

    const verified = speakeasy.totp.verify({
      secret: twoFA.secret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified) {
      throw new AppError('Invalid 2FA token', 400, 'INVALID_2FA_TOKEN');
    }

    twoFA.isEnabled = true;
    twoFA.enabledAt = new Date();
    await twoFA.save();

    return true;
  }

  // Verify 2FA token
  async verify2FA(userId, token) {
    const twoFA = await TwoFactorAuth.findOne({ userId, isEnabled: true });
    if (!twoFA) {
      throw new AppError('2FA not enabled', 400, 'TWO_FA_NOT_ENABLED');
    }

    // Try TOTP first
    const verified = speakeasy.totp.verify({
      secret: twoFA.secret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (verified) {
      twoFA.lastUsedAt = new Date();
      await twoFA.save();
      return true;
    }

    // Try backup codes
    const backupCode = twoFA.backupCodes.find(bc => 
      bc.code === token.toUpperCase() && !bc.isUsed
    );

    if (backupCode) {
      backupCode.isUsed = true;
      backupCode.usedAt = new Date();
      twoFA.lastUsedAt = new Date();
      await twoFA.save();
      return true;
    }

    throw new AppError('Invalid 2FA token or backup code', 400, 'INVALID_2FA_TOKEN');
  }

  // Check if user requires 2FA
  async requires2FA(userId) {
    const user = await User.findById(userId);
    if (!user) return false;

    return user.roles.some(role => 
      ['elika_admin', 'finance_team'].includes(role.role)
    );
  }

  // Check if user has 2FA enabled
  async has2FAEnabled(userId) {
    const twoFA = await TwoFactorAuth.findOne({ userId, isEnabled: true });
    return !!twoFA;
  }

  // Disable 2FA
  async disable2FA(userId, token) {
    const verified = await this.verify2FA(userId, token);
    if (!verified) {
      throw new AppError('Invalid 2FA token', 400, 'INVALID_2FA_TOKEN');
    }

    await TwoFactorAuth.findOneAndUpdate(
      { userId },
      { isEnabled: false }
    );

    return true;
  }

  // Get device info from request
  getDeviceInfo(req) {
    return {
      userAgent: req.get('User-Agent') || '',
      ipAddress: req.ip || req.connection.remoteAddress || '',
      deviceId: req.get('X-Device-ID') || ''
    };
  }

  // Clean up expired tokens (should be run periodically)
  async cleanupExpiredTokens() {
    const now = new Date();
    
    await RefreshToken.deleteMany({
      $or: [
        { expiresAt: { $lt: now } },
        { isRevoked: true, revokedAt: { $lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } }
      ]
    });

    await EmailVerification.deleteMany({
      $or: [
        { expiresAt: { $lt: now } },
        { isUsed: true, usedAt: { $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }
      ]
    });

    await PasswordReset.deleteMany({
      $or: [
        { expiresAt: { $lt: now } },
        { isUsed: true, usedAt: { $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }
      ]
    });
  }
}

module.exports = new AuthService();