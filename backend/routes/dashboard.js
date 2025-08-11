
const express = require('express');
const Candidate = require('../models/Candidate');
const Interview = require('../models/Interview');
const Invoice = require('../models/Invoice');
const JobDescription = require('../models/JobDescription');
const Vendor = require('../models/Vendor');
const { authenticateToken, requireVendorAccess, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get vendor dashboard stats
router.get('/vendor-stats', authenticateToken, requireVendorAccess, async (req, res) => {
  try {
    // Get active jobs count
    const activeJobs = await JobDescription.countDocuments({
      assignedVendors: req.vendorId,
      status: 'active'
    });

    // Get total submissions
    const totalSubmissions = await Candidate.countDocuments({
      vendorId: req.vendorId
    });

    // Get shortlisted candidates
    const shortlistedCandidates = await Candidate.countDocuments({
      vendorId: req.vendorId,
      status: 'shortlisted'
    });

    // Get pending interviews
    const pendingInterviews = await Interview.countDocuments({
      vendorId: req.vendorId,
      status: 'scheduled'
    });

    // Get completed joins
    const completedJoins = await Candidate.countDocuments({
      vendorId: req.vendorId,
      status: 'hired'
    });

    // Get pending invoices
    const pendingInvoices = await Invoice.countDocuments({
      vendorId: req.vendorId,
      status: 'pending'
    });

    // Calculate total earnings
    const paidInvoices = await Invoice.find({
      vendorId: req.vendorId,
      status: 'paid'
    });
    const totalEarnings = paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);

    // Calculate this month earnings
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const thisMonthInvoices = await Invoice.find({
      vendorId: req.vendorId,
      status: 'paid',
      paidAt: { $gte: thisMonthStart }
    });
    const thisMonthEarnings = thisMonthInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);

    res.json({
      activeJobs: activeJobs || 0,
      totalSubmissions: totalSubmissions || 0,
      shortlistedCandidates: shortlistedCandidates || 0,
      pendingInterviews: pendingInterviews || 0,
      completedJoins: completedJoins || 0,
      pendingInvoices: pendingInvoices || 0,
      totalEarnings,
      thisMonthEarnings,
      // Legacy fields for compatibility
      totalCandidates: totalSubmissions || 0,
      candidatesSubmitted: totalSubmissions || 0,
      scheduledInterviews: pendingInterviews || 0,
      interviewsScheduled: pendingInterviews || 0,
      totalInvoices: pendingInvoices || 0,
      pendingApprovals: pendingInvoices || 0,
      pendingInvoicesAmount: paidInvoices.reduce((sum, invoice) => sum + (invoice.status === 'pending' ? invoice.amount : 0), 0)
    });
  } catch (error) {
    console.error('Error fetching vendor stats:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch dashboard statistics',
      code: 'FETCH_STATS_ERROR'
    });
  }
});

// Get admin dashboard stats (Elika users only)
router.get('/admin-stats', authenticateToken, requireRole(['elika_admin', 'delivery_head', 'finance_team']), async (req, res) => {
  try {
    // Get all stats across all vendors
    const activeJobs = await JobDescription.countDocuments({ status: 'active' });
    const totalCandidates = await Candidate.countDocuments();
    const scheduledInterviews = await Interview.countDocuments({ status: 'scheduled' });
    const pendingInvoices = await Invoice.countDocuments({ status: 'pending' });
    const totalInvoices = await Invoice.countDocuments();
    const pendingApprovals = await Vendor.countDocuments({ status: 'pending' });

    // Calculate pending invoices amount
    const pendingInvoicesList = await Invoice.find({ status: 'pending' });
    const pendingInvoicesAmount = pendingInvoicesList.reduce((sum, invoice) => sum + invoice.amount, 0);

    res.json({
      activeJobs: activeJobs || 0,
      totalCandidates: totalCandidates || 0,
      candidatesSubmitted: totalCandidates || 0,
      scheduledInterviews: scheduledInterviews || 0,
      interviewsScheduled: scheduledInterviews || 0,
      pendingInvoices: pendingInvoices || 0,
      totalInvoices: totalInvoices || 0,
      pendingApprovals: pendingApprovals || 0,
      pendingInvoicesAmount: pendingInvoicesAmount || 0
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch admin dashboard statistics',
      code: 'FETCH_ADMIN_STATS_ERROR'
    });
  }
});

module.exports = router;
