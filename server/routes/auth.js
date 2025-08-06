const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: true,
        message: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        error: true,
        message: error.message,
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Get user roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role, vendor_id')
      .eq('user_id', data.user.id);

    // Get vendor info if user has vendor role
    let vendorInfo = null;
    const vendorRole = roles?.find(role => role.vendor_id);
    if (vendorRole) {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('name')
        .eq('id', vendorRole.vendor_id)
        .single();
      vendorInfo = vendor;
    }

    res.json({
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        roles: roles?.map(r => r.role) || [],
        vendorId: vendorRole?.vendor_id || null,
        vendorName: vendorInfo?.name || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.message,
        code: 'LOGOUT_ERROR'
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        roles: req.userRoles.map(r => r.role),
        vendorId: req.userRoles.find(r => r.vendor_id)?.vendor_id || null,
        profile
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: true,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;