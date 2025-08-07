const express = require('express');
const Candidate = require('../models/Candidate');
const Interview = require('../models/Interview');
const Invoice = require('../models/Invoice');
const JobDescription = require('../models/JobDescription');
const { authenticateToken, requireVendorAccess } = require('../middleware/auth');

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
      thisMonthEarnings
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

module.exports = router;