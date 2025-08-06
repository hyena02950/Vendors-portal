const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: true,
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Get user roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role, vendor_id')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
    }

    req.user = user;
    req.userRoles = roles || [];
    req.supabase = supabase;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: true,
      message: 'Authentication error',
      code: 'AUTH_ERROR'
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

  req.vendorId = vendorRoles[0].vendor_id;
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireVendorAccess
};