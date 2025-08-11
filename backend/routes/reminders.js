
const express = require('express');
const Vendor = require('../models/Vendor');
const { authenticateToken, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Get pending reminders (Admin only)
router.get('/pending', authenticateToken, requireRole(['elika_admin']), asyncHandler(async (req, res) => {
  try {
    // Get vendors with pending documents or applications
    const vendors = await Vendor.find({
      $or: [
        { 'documents.status': 'pending' },
        { 'application.status': 'submitted' },
        { status: 'pending' }
      ]
    }).populate('createdBy', 'email profile.fullName');

    const reminders = [];

    vendors.forEach(vendor => {
      // Check for pending documents
      const pendingDocs = vendor.documents.filter(doc => doc.status === 'pending');
      if (pendingDocs.length > 0) {
        reminders.push({
          id: `vendor-${vendor._id}-docs`,
          type: 'document_review',
          title: 'Document Review Pending',
          message: `${vendor.name} has ${pendingDocs.length} document(s) pending review`,
          vendorId: vendor._id,
          vendorName: vendor.name,
          priority: 'high',
          daysOverdue: Math.floor((new Date() - new Date(Math.max(...pendingDocs.map(d => new Date(d.uploadedAt))))) / (1000 * 60 * 60 * 24)),
          createdAt: new Date(Math.max(...pendingDocs.map(d => new Date(d.uploadedAt))))
        });
      }

      // Check for pending applications
      if (vendor.application && vendor.application.status === 'submitted') {
        const daysSinceSubmission = Math.floor((new Date() - new Date(vendor.application.submittedAt)) / (1000 * 60 * 60 * 24));
        reminders.push({
          id: `vendor-${vendor._id}-app`,
          type: 'application_review',
          title: 'Application Review Pending',
          message: `${vendor.name}'s application has been pending review for ${daysSinceSubmission} days`,
          vendorId: vendor._id,
          vendorName: vendor.name,
          priority: daysSinceSubmission > 3 ? 'high' : 'medium',
          daysOverdue: daysSinceSubmission,
          createdAt: vendor.application.submittedAt
        });
      }
    });

    // Sort by priority and days overdue
    reminders.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      return b.daysOverdue - a.daysOverdue;
    });

    res.json({
      reminders: reminders.slice(0, 20) // Limit to 20 most important reminders
    });
  } catch (error) {
    console.error('Error fetching pending reminders:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch pending reminders',
      code: 'REMINDERS_ERROR'
    });
  }
}));

module.exports = router;
