const express = require('express');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Create new vendor
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, address, contactPerson } = req.body;

    if (!name || !email || !contactPerson) {
      return res.status(400).json({
        error: true,
        message: 'Name, email, and contact person are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Check if vendor already exists
    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor) {
      return res.status(400).json({
        error: true,
        message: 'Vendor with this email already exists',
        code: 'VENDOR_EXISTS'
      });
    }

    const vendor = new Vendor({
      name,
      email,
      phone,
      address,
      contactPerson,
      createdBy: req.user._id
    });

    await vendor.save();

    // Add vendor_admin role to the creating user
    req.user.roles.push({
      role: 'vendor_admin',
      vendorId: vendor._id
    });
    await req.user.save();

    res.status(201).json({
      message: 'Vendor created successfully',
      vendor: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        status: vendor.status
      }
    });
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to create vendor',
      code: 'CREATE_VENDOR_ERROR'
    });
  }
});

// Get all vendors (admin only)
router.get('/', authenticateToken, requireRole(['elika_admin', 'delivery_head']), async (req, res) => {
  try {
    const vendors = await Vendor.find()
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 });

    res.json({ vendors });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch vendors',
      code: 'FETCH_VENDORS_ERROR'
    });
  }
});

// Update vendor status (admin only)
router.patch('/:id/status', authenticateToken, requireRole(['elika_admin']), async (req, res) => {
  try {
    const { status } = req.body;
    const vendorId = req.params.id;

    if (!['pending', 'active', 'inactive', 'rejected'].includes(status)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid status',
        code: 'INVALID_STATUS'
      });
    }

    const vendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!vendor) {
      return res.status(404).json({
        error: true,
        message: 'Vendor not found',
        code: 'VENDOR_NOT_FOUND'
      });
    }

    res.json({ message: `Vendor status updated to ${status}` });
  } catch (error) {
    console.error('Error updating vendor status:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update vendor status',
      code: 'UPDATE_VENDOR_ERROR'
    });
  }
});

module.exports = router;