
const express = require('express');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const { authenticateToken, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const router = express.Router();

// GET /api/users/profiles - Get all user profiles (Elika Admin only)
router.get('/profiles', authenticateToken, requireRole(['elika_admin']), asyncHandler(async (req, res) => {
  const users = await User.find({ isActive: true })
    .select('-password')
    .populate('roles.vendorId', 'name');

  const profiles = users.map(user => ({
    _id: user._id.toString(),
    id: user._id.toString(),
    email: user.email,
    name: user.profile?.fullName || user.profile?.contactPerson || user.email.split('@')[0],
    full_name: user.profile?.fullName || user.profile?.contactPerson || '',
    user_roles: user.roles.map(role => ({
      role: role.role,
      vendorId: role.vendorId
    })),
    created_at: user.createdAt,
    last_login: user.lastLogin
  }));

  res.json({ profiles });
}));

// GET /api/users/:userId/roles - Get user roles
router.get('/:userId/roles', authenticateToken, requireRole(['elika_admin']), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select('roles').populate('roles.vendorId', 'name');
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  res.json({
    roles: user.roles
  });
}));

// GET /api/users/lookup - Lookup user by email
router.get('/lookup', authenticateToken, requireRole(['elika_admin']), asyncHandler(async (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({
      error: true,
      message: 'Email parameter is required',
      code: 'MISSING_EMAIL'
    });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('_id email profile');
  
  if (!user) {
    return res.status(404).json({
      error: true,
      message: 'User not found with this email. Please make sure the user has signed up first.',
      code: 'USER_NOT_FOUND'
    });
  }

  res.json({
    userId: user._id.toString(),
    email: user.email,
    name: user.profile?.fullName || user.profile?.contactPerson || user.email.split('@')[0]
  });
}));

// GET /api/users/roles - Get all user roles (Admin only)
router.get('/roles', authenticateToken, requireRole(['elika_admin']), asyncHandler(async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('_id email roles profile')
      .populate('roles.vendorId', 'name');

    const allRoles = [];
    
    users.forEach(user => {
      user.roles.forEach((role, index) => {
        allRoles.push({
          _id: `${user._id}_${role.role}_${index}`,
          userId: user._id.toString(),
          role: role.role,
          vendorId: role.vendorId ? role.vendorId._id : null,
          vendorName: role.vendorId ? role.vendorId.name : null,
          createdAt: user.createdAt,
          userName: user.profile?.fullName || user.profile?.contactPerson || user.email.split('@')[0]
        });
      });
    });

    res.json({
      roles: allRoles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch roles',
      code: 'FETCH_ROLES_ERROR'
    });
  }
}));

// POST /api/users/roles - Assign role to user
router.post('/roles', authenticateToken, requireRole(['elika_admin']), asyncHandler(async (req, res) => {
  const { userId, role, vendorId } = req.body;

  console.log('Assigning role:', { userId, role, vendorId });

  if (!userId || !role) {
    throw new AppError('UserId and role are required', 400, 'MISSING_FIELDS');
  }

  // Validate that vendorId is provided for vendor roles
  if (['vendor_admin', 'vendor_recruiter'].includes(role) && !vendorId) {
    throw new AppError('VendorId is required for vendor roles', 400, 'VENDOR_ID_REQUIRED');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Validate vendor exists if vendorId is provided
  if (vendorId) {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      throw new AppError('Vendor not found', 404, 'VENDOR_NOT_FOUND');
    }
  }

  // Remove existing roles of the same type
  if (['vendor_admin', 'vendor_recruiter'].includes(role)) {
    // Remove all vendor roles
    user.roles = user.roles.filter(r => !['vendor_admin', 'vendor_recruiter'].includes(r.role));
  } else {
    // Remove all elika roles
    user.roles = user.roles.filter(r => !['elika_admin', 'delivery_head', 'finance_team'].includes(r.role));
  }

  // Add new role
  const newRole = { role };
  if (vendorId && ['vendor_admin', 'vendor_recruiter'].includes(role)) {
    newRole.vendorId = vendorId;
  }

  user.roles.push(newRole);
  
  try {
    await user.save();
    console.log('Role assigned successfully:', user.roles);
  } catch (saveError) {
    console.error('Error saving user with new role:', saveError);
    throw new AppError('Failed to save role assignment', 500, 'SAVE_ERROR');
  }

  res.json({
    message: 'Role assigned successfully',
    user: {
      id: user._id,
      email: user.email,
      roles: user.roles
    }
  });
}));

// DELETE /api/users/roles/:roleId - Remove role from user
router.delete('/roles/:roleId', authenticateToken, requireRole(['elika_admin']), asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  
  // roleId format: userId_role_index
  const parts = roleId.split('_');
  const userId = parts[0];
  const roleToRemove = parts[1];
  
  if (!userId || !roleToRemove) {
    return res.status(400).json({
      error: true,
      message: 'Invalid role ID format',
      code: 'INVALID_ROLE_ID'
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      error: true,
      message: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  // Remove the specific role
  user.roles = user.roles.filter(r => r.role !== roleToRemove);
  await user.save();

  res.json({
    message: 'Role removed successfully'
  });
}));

// DELETE /api/users/:userId - Delete user
router.delete('/:userId', authenticateToken, requireRole(['elika_admin']), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Soft delete by setting isActive to false
  user.isActive = false;
  await user.save();

  res.json({
    message: 'User deleted successfully'
  });
}));

module.exports = router;
