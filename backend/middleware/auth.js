const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: true,
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    req.user = user;
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
  requireRole,
  requireVendorAccess
};