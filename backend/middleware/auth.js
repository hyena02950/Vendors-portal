
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authService = require('../services/authService');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: true,
        message: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: true,
          message: 'Access token expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      throw jwtError;
    }

    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: true,
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Check token version for revocation
    if (decoded.tokenVersion !== undefined && user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({
        error: true,
        message: 'Token has been revoked',
        code: 'TOKEN_REVOKED'
      });
    }

    // Check if user requires 2FA and it's enabled
    const requires2FA = await authService.requires2FA(user._id);
    const has2FAEnabled = await authService.has2FAEnabled(user._id);
    
    if (requires2FA && !has2FAEnabled) {
      return res.status(403).json({
        error: true,
        message: '2FA setup required for this role',
        code: 'TWO_FA_SETUP_REQUIRED'
      });
    }

    // Ensure req.user has all necessary fields
    req.user = {
      id: user._id.toString(),
      _id: user._id,
      email: user.email,
      roles: user.roles,
      profile: user.profile,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      tokenVersion: user.tokenVersion || 0
    };
    req.userRoles = user.roles;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      error: true,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

// Middleware to require email verification
const requireEmailVerification = (req, res, next) => {
  if (!req.user.emailVerified) {
    return res.status(403).json({
      error: true,
      message: 'Email verification required',
      code: 'EMAIL_VERIFICATION_REQUIRED'
    });
  }
  next();
};

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRoles || req.userRoles.length === 0) {
      return res.status(403).json({
        error: true,
        message: 'No roles assigned',
        code: 'NO_ROLES'
      });
    }

    const hasRequiredRole = req.userRoles.some(userRole => 
      allowedRoles.includes(userRole.role)
    );

    if (!hasRequiredRole) {
      return res.status(403).json({
        error: true,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

const requireVendorAccess = (req, res, next) => {
  const vendorRoles = req.userRoles.filter(role => 
    ['vendor_admin', 'vendor_recruiter'].includes(role.role)
  );

  if (vendorRoles.length === 0) {
    return res.status(403).json({
      error: true,
      message: 'Vendor access required',
      code: 'VENDOR_ACCESS_REQUIRED'
    });
  }

  req.vendorId = vendorRoles[0].vendorId;
  next();
};

module.exports = {
  authenticateToken,
  requireEmailVerification,
  requireRole,
  requireVendorAccess
};
