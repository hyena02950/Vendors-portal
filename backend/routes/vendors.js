
const express = require('express');
const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const router = express.Router();

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
};

// GET /api/vendors/workflow-status - Get workflow status counts
router.get('/workflow-status', auth.authenticateToken, asyncHandler(async (req, res) => {
  console.log('Fetching workflow status counts');
  
  try {
    const counts = await Vendor.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const statusCounts = {
      pending: 0,
      active: 0,
      inactive: 0,
      rejected: 0
    };
    
    counts.forEach(item => {
      if (statusCounts.hasOwnProperty(item._id)) {
        statusCounts[item._id] = item.count;
      }
    });
    
    res.json({
      success: true,
      data: statusCounts
    });
  } catch (error) {
    console.error('Error fetching workflow status:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch workflow status',
      code: 'WORKFLOW_STATUS_ERROR'
    });
  }
}));

// GET /api/vendors - Get all vendors
router.get('/', auth.authenticateToken, asyncHandler(async (req, res) => {
  console.log('Fetching all vendors');
  
  try {
    const vendors = await Vendor.find()
      .populate('createdBy', 'email profile')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: vendors
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch vendors',
      code: 'FETCH_VENDORS_ERROR'
    });
  }
}));

// GET /api/vendors/:id/application - Get vendor application
router.get('/:id/application', auth.authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  console.log('Fetching application for vendor:', id);
  
  if (!isValidObjectId(id)) {
    return res.status(400).json({
      error: true,
      message: 'Invalid vendor ID format',
      code: 'INVALID_ID_FORMAT'
    });
  }
  
  try {
    const vendor = await Vendor.findById(id);
    
    if (!vendor) {
      return res.status(404).json({
        error: true,
        message: 'Vendor not found',
        code: 'VENDOR_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      application: {
        id: vendor._id,
        vendor_id: vendor._id,
        status: vendor.application?.status || 'draft',
        submitted_at: vendor.application?.submittedAt || null,
        reviewed_at: vendor.application?.reviewedAt || null,
        reviewed_by: vendor.application?.reviewedBy || null,
        review_notes: vendor.application?.reviewNotes || null,
        created_at: vendor.createdAt,
        updated_at: vendor.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching vendor application:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch vendor application',
      code: 'FETCH_APPLICATION_ERROR'
    });
  }
}));

// POST /api/vendors/:id/application/submit - Submit vendor application
router.post('/:id/application/submit', auth.authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  console.log('Submitting application for vendor:', id);
  
  if (!isValidObjectId(id)) {
    return res.status(400).json({
      error: true,
      message: 'Invalid vendor ID format',
      code: 'INVALID_ID_FORMAT'
    });
  }
  
  try {
    const vendor = await Vendor.findById(id);
    
    if (!vendor) {
      return res.status(404).json({
        error: true,
        message: 'Vendor not found',
        code: 'VENDOR_NOT_FOUND'
      });
    }
    
    // Update application status
    vendor.application = {
      ...vendor.application,
      status: 'submitted',
      submittedAt: new Date()
    };
    
    await vendor.save();
    
    res.json({
      success: true,
      message: 'Application submitted successfully',
      application: {
        id: vendor._id,
        vendor_id: vendor._id,
        status: vendor.application.status,
        submitted_at: vendor.application.submittedAt,
        reviewed_at: vendor.application.reviewedAt,
        reviewed_by: vendor.application.reviewedBy,
        review_notes: vendor.application.reviewNotes,
        created_at: vendor.createdAt,
        updated_at: vendor.updatedAt
      }
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to submit application',
      code: 'SUBMIT_APPLICATION_ERROR'
    });
  }
}));

// PATCH /api/vendors/applications/:id/status - Update application status (Admin only)
router.patch('/applications/:id/status', auth.authenticateToken, auth.requireRole(['elika_admin']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reviewNotes } = req.body;
  
  console.log('Updating application status:', id, status);
  
  if (!isValidObjectId(id)) {
    return res.status(400).json({
      error: true,
      message: 'Invalid application ID format',
      code: 'INVALID_ID_FORMAT'
    });
  }
  
  try {
    const vendor = await Vendor.findById(id);
    
    if (!vendor) {
      return res.status(404).json({
        error: true,
        message: 'Application not found',
        code: 'APPLICATION_NOT_FOUND'
      });
    }
    
    // Update application status
    vendor.application = {
      ...vendor.application,
      status,
      reviewedAt: new Date(),
      reviewedBy: req.user.id,
      reviewNotes: reviewNotes || vendor.application?.reviewNotes
    };
    
    await vendor.save();
    
    res.json({
      success: true,
      message: 'Application status updated successfully'
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update application status',
      code: 'UPDATE_APPLICATION_ERROR'
    });
  }
}));

// GET /api/vendors/:id/documents - Get vendor documents
router.get('/:id/documents', auth.authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  console.log('Fetching documents for vendor:', id);
  
  if (!isValidObjectId(id)) {
    return res.status(400).json({
      error: true,
      message: 'Invalid vendor ID format',
      code: 'INVALID_ID_FORMAT'
    });
  }
  
  try {
    const vendor = await Vendor.findById(id);
    
    if (!vendor) {
      return res.status(404).json({
        error: true,
        message: 'Vendor not found',
        code: 'VENDOR_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: vendor.documents || []
    });
  } catch (error) {
    console.error('Error fetching vendor documents:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch vendor documents',
      code: 'FETCH_DOCUMENTS_ERROR'
    });
  }
}));

// GET /api/vendors/:id - Get vendor by ID
router.get('/:id', auth.authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  console.log('Fetching vendor by ID:', id);
  
  if (!isValidObjectId(id)) {
    return res.status(400).json({
      error: true,
      message: 'Invalid vendor ID format',
      code: 'INVALID_ID_FORMAT'
    });
  }
  
  try {
    const vendor = await Vendor.findById(id)
      .populate('createdBy', 'email profile');
    
    if (!vendor) {
      return res.status(404).json({
        error: true,
        message: 'Vendor not found',
        code: 'VENDOR_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch vendor',
      code: 'FETCH_VENDOR_ERROR'
    });
  }
}));

// POST /api/vendors - Create new vendor
router.post('/', auth.authenticateToken, asyncHandler(async (req, res) => {
  console.log('Creating new vendor:', req.body);
  console.log('User from request:', req.user);
  
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      error: true,
      message: 'User authentication required',
      code: 'USER_NOT_AUTHENTICATED'
    });
  }

  try {
    const vendorData = {
      ...req.body,
      createdBy: req.user.id,
      status: 'pending'
    };
    
    console.log('Vendor data with createdBy:', vendorData);
    
    const vendor = new Vendor(vendorData);
    await vendor.save();
    
    // Update user role to vendor_admin and link to this vendor
    const user = await User.findById(req.user.id);
    if (user) {
      // Add vendor_admin role with vendorId
      const vendorRole = {
        role: 'vendor_admin',
        vendorId: vendor._id
      };
      
      // Remove any existing vendor roles and add the new one
      user.roles = user.roles.filter(r => !['vendor_admin', 'vendor_recruiter'].includes(r.role));
      user.roles.push(vendorRole);
      
      await user.save();
      console.log('Updated user roles:', user.roles);
    }
    
    await vendor.populate('createdBy', 'email profile');
    
    res.status(201).json({
      success: true,
      data: vendor,
      message: 'Vendor created successfully'
    });
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(400).json({
      error: true,
      message: error.message || 'Failed to create vendor',
      code: 'CREATE_VENDOR_ERROR'
    });
  }
}));

// PUT /api/vendors/:id - Update vendor
router.put('/:id', auth.authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  console.log('Updating vendor:', id, req.body);
  
  if (!isValidObjectId(id)) {
    return res.status(400).json({
      error: true,
      message: 'Invalid vendor ID format',
      code: 'INVALID_ID_FORMAT'
    });
  }
  
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'email profile');
    
    if (!vendor) {
      return res.status(404).json({
        error: true,
        message: 'Vendor not found',
        code: 'VENDOR_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: vendor,
      message: 'Vendor updated successfully'
    });
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(400).json({
      error: true,
      message: error.message || 'Failed to update vendor',
      code: 'UPDATE_VENDOR_ERROR'
    });
  }
}));

// DELETE /api/vendors/:id - Delete vendor
router.delete('/:id', auth.authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  console.log('Deleting vendor:', id);
  
  if (!isValidObjectId(id)) {
    return res.status(400).json({
      error: true,
      message: 'Invalid vendor ID format',
      code: 'INVALID_ID_FORMAT'
    });
  }
  
  try {
    const vendor = await Vendor.findByIdAndDelete(id);
    
    if (!vendor) {
      return res.status(404).json({
        error: true,
        message: 'Vendor not found',
        code: 'VENDOR_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      message: 'Vendor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to delete vendor',
      code: 'DELETE_VENDOR_ERROR'
    });
  }
}));

module.exports = router;
