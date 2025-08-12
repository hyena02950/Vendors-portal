
const express = require('express');
const Vendor = require('../models/Vendor');
const Candidate = require('../models/Candidate');
const Invoice = require('../models/Invoice');
const { authenticateToken } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Get user notifications
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const userRoles = req.userRoles || [];
  const isElikaUser = userRoles.some(role => 
    ['elika_admin', 'delivery_head', 'finance_team'].includes(role.role)
  );
  const isVendorUser = userRoles.some(role => 
    ['vendor_admin', 'vendor_recruiter'].includes(role.role)
  );

  const notifications = [];

  try {
    if (isElikaUser) {
      // Admin notifications
      const pendingDocuments = await Vendor.find({
        'documents.status': 'pending'
      }).countDocuments();

      const submittedApplications = await Vendor.find({
        'application.status': 'submitted'
      }).countDocuments();

      const pendingInvoices = await Invoice.find({
        status: 'pending'
      }).countDocuments();

      if (pendingDocuments > 0) {
        notifications.push({
          id: 'pending-docs',
          title: 'Document Review Required',
          message: `${pendingDocuments} vendor documents are pending your review`,
          type: 'info',
          read: false,
          created_at: new Date().toISOString()
        });
      }

      if (submittedApplications > 0) {
        notifications.push({
          id: 'submitted-apps',
          title: 'Applications Pending Review',
          message: `${submittedApplications} vendor applications are awaiting review`,
          type: 'info',
          read: false,
          created_at: new Date().toISOString()
        });
      }

      if (pendingInvoices > 0) {
        notifications.push({
          id: 'pending-invoices',
          title: 'Invoices Pending Approval',
          message: `${pendingInvoices} invoices are pending approval`,
          type: 'info',
          read: false,
          created_at: new Date().toISOString()
        });
      }
    }

    if (isVendorUser && req.vendorId) {
      // Vendor notifications
      const vendor = await Vendor.findById(req.vendorId);
      
      if (vendor) {
        const rejectedDocs = vendor.documents.filter(doc => doc.status === 'rejected');
        
        if (rejectedDocs.length > 0) {
          notifications.push({
            id: 'rejected-docs',
            title: 'Documents Rejected',
            message: `${rejectedDocs.length} of your documents have been rejected and need to be re-uploaded`,
            type: 'warning',
            read: false,
            created_at: new Date().toISOString()
          });
        }

        if (vendor.application?.status === 'approved') {
          notifications.push({
            id: 'app-approved',
            title: 'Application Approved!',
            message: 'Congratulations! Your vendor application has been approved',
            type: 'success',
            read: false,
            created_at: vendor.application.reviewedAt?.toISOString() || new Date().toISOString()
          });
        }

        if (vendor.application?.status === 'rejected') {
          notifications.push({
            id: 'app-rejected',
            title: 'Application Rejected',
            message: 'Your vendor application has been rejected. Please review the feedback and resubmit.',
            type: 'error',
            read: false,
            created_at: vendor.application.reviewedAt?.toISOString() || new Date().toISOString()
          });
        }
      }
    }
  } catch (error) {
    console.error('Error generating notifications:', error);
  }

  res.json({
    notifications
  });
}));

// Mark notification as read
router.patch('/:id/read', authenticateToken, asyncHandler(async (req, res) => {
  // In a real implementation, you would update the notification in the database
  res.json({
    message: 'Notification marked as read'
  });
}));

// Mark all notifications as read
router.patch('/mark-all-read', authenticateToken, asyncHandler(async (req, res) => {
  // In a real implementation, you would update all user notifications in the database
  res.json({
    message: 'All notifications marked as read'
  });
}));

module.exports = router;
