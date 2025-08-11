const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { loginSchema, registerSchema } = require('../validators/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const authService = require('../services/authService');

const router = express.Router();

// POST /api/auth/register
router.post('/register', asyncHandler(async (req, res) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: true,
      message: error.details[0].message,
      code: 'VALIDATION_ERROR'
    });
  }

  const { email, password, companyName, contactPerson } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({
      error: true,
      message: 'User already exists with this email',
      code: 'USER_EXISTS'
    });
  }

  // Create new user with NO roles initially - roles will be assigned after vendor creation
  const user = new User({
    email: email.toLowerCase(),
    password,
    roles: [], // Start with empty roles array
    profile: {
      companyName: companyName || '',
      contactPerson: contactPerson || email.split('@')[0],
      fullName: contactPerson || email.split('@')[0]
    }
  });

  await user.save();

  // Generate tokens
  const deviceInfo = authService.getDeviceInfo(req);
  const accessToken = authService.generateAccessToken(user._id);
  const refreshToken = await authService.generateRefreshToken(user._id, deviceInfo);

  // Generate email verification token
  const verificationToken = await authService.generateEmailVerificationToken(user._id, user.email);

  // Return user data without password
  const userData = {
    id: user._id.toString(),
    email: user.email,
    roles: user.roles,
    profile: user.profile
  };

  res.status(201).json({
    message: 'User registered successfully',
    accessToken,
    refreshToken,
    user: userData,
    emailVerificationRequired: true
  });
}));

// POST /api/auth/login
router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: true,
      message: error.details[0].message,
      code: 'VALIDATION_ERROR'
    });
  }

  const { email, password, twoFactorToken } = req.body;

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.isActive) {
    return res.status(401).json({
      error: true,
      message: 'Invalid email or password',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      error: true,
      message: 'Invalid email or password',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Check if 2FA is required and enabled
  const requires2FA = await authService.requires2FA(user._id);
  const has2FAEnabled = await authService.has2FAEnabled(user._id);

  if (requires2FA && has2FAEnabled) {
    if (!twoFactorToken) {
      return res.status(200).json({
        message: '2FA token required',
        requires2FA: true,
        tempUserId: user._id // Temporary identifier for 2FA verification
      });
    }

    try {
      await authService.verify2FA(user._id, twoFactorToken);
    } catch (error) {
      return res.status(401).json({
        error: true,
        message: 'Invalid 2FA token',
        code: 'INVALID_2FA_TOKEN'
      });
    }
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const deviceInfo = authService.getDeviceInfo(req);
  const accessToken = authService.generateAccessToken(user._id, user.tokenVersion || 0);
  const refreshToken = await authService.generateRefreshToken(user._id, deviceInfo);

  // Return user data without password
  const userData = {
    id: user._id.toString(),
    email: user.email,
    roles: user.roles,
    profile: user.profile
  };

  res.json({
    message: 'Login successful',
    accessToken,
    refreshToken,
    user: userData
  });
}));

// POST /api/auth/refresh
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token required', 400, 'REFRESH_TOKEN_REQUIRED');
  }

  try {
    const deviceInfo = authService.getDeviceInfo(req);
    const result = await authService.refreshAccessToken(refreshToken, deviceInfo);

    res.json({
      message: 'Token refreshed successfully',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user
    });
  } catch (error) {
    throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }
}));

// POST /api/auth/logout
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  const { refreshToken, logoutAllDevices } = req.body;

  if (logoutAllDevices) {
    // Revoke all tokens for this user
    await authService.revokeAllUserTokens(req.user._id, 'Logout all devices');
  } else if (refreshToken) {
    // Revoke specific refresh token
    await authService.revokeRefreshToken(refreshToken, 'User logout');
  }

  res.json({
    message: 'Logout successful'
  });
}));

// POST /api/auth/verify-email
router.post('/verify-email', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new AppError('Verification token required', 400, 'TOKEN_REQUIRED');
  }

  await authService.verifyEmailToken(token);

  res.json({
    message: 'Email verified successfully'
  });
}));

// POST /api/auth/forgot-password
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email required', 400, 'EMAIL_REQUIRED');
  }

  const result = await authService.generatePasswordResetToken(
    email,
    req.ip,
    req.get('User-Agent')
  );

  // Always return success to prevent email enumeration
  res.json({
    message: 'If an account with that email exists, a password reset link has been sent.'
  });

  // In a real implementation, send email here
  if (result) {
    console.log(`Password reset token for ${email}: ${result.token}`);
  }
}));

// POST /api/auth/reset-password
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw new AppError('Token and password required', 400, 'MISSING_FIELDS');
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400, 'PASSWORD_TOO_SHORT');
  }

  await authService.resetPassword(token, password);

  res.json({
    message: 'Password reset successfully'
  });
}));

// POST /api/auth/setup-2fa
router.post('/setup-2fa', authenticateToken, asyncHandler(async (req, res) => {
  const result = await authService.setup2FA(req.user._id);

  res.json({
    message: '2FA setup initiated',
    ...result
  });
}));

// POST /api/auth/enable-2fa
router.post('/enable-2fa', authenticateToken, asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new AppError('2FA token required', 400, 'TOKEN_REQUIRED');
  }

  await authService.enable2FA(req.user._id, token);

  res.json({
    message: '2FA enabled successfully'
  });
}));

// POST /api/auth/disable-2fa
router.post('/disable-2fa', authenticateToken, asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new AppError('2FA token required', 400, 'TOKEN_REQUIRED');
  }

  await authService.disable2FA(req.user._id, token);

  res.json({
    message: '2FA disabled successfully'
  });
}));

// GET /api/auth/me
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  
  if (!user || !user.isActive) {
    return res.status(401).json({
      error: true,
      message: 'User not found or inactive',
      code: 'USER_NOT_FOUND'
    });
  }

  const userData = {
    id: user._id.toString(),
    email: user.email,
    roles: user.roles,
    profile: user.profile,
    emailVerified: user.emailVerified,
    requires2FA: await authService.requires2FA(user._id),
    has2FAEnabled: await authService.has2FAEnabled(user._id)
  };

  res.json({
    user: userData
  });
}));

module.exports = router;