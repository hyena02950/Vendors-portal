
const express = require('express');
const Vendor = require('../models/Vendor');
const Candidate = require('../models/Candidate');
const Interview = require('../models/Interview');
const Invoice = require('../models/Invoice');
const JobDescription = require('../models/JobDescription');
const { authenticateToken, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Get analytics data (Admin only)
router.get('/', authenticateToken, requireRole(['elika_admin']), asyncHandler(async (req, res) => {
  const { timeRange = 'last30days' } = req.query;
  
  // Calculate date range
  const now = new Date();
  let startDate = new Date();
  
  switch (timeRange) {
    case 'last7days':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'last30days':
      startDate.setDate(now.getDate() - 30);
      break;
    case 'last3months':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'last6months':
      startDate.setMonth(now.getMonth() - 6);
      break;
    case 'lastyear':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setDate(now.getDate() - 30);
  }

  try {
    // Vendor metrics
    const totalVendors = await Vendor.countDocuments();
    const activeVendors = await Vendor.countDocuments({ status: 'active' });
    
    // Calculate average onboarding time
    const approvedVendors = await Vendor.find({ 
      status: 'active',
      'application.reviewedAt': { $exists: true }
    });
    
    const avgOnboardingTime = approvedVendors.length > 0 
      ? approvedVendors.reduce((sum, vendor) => {
          const days = Math.floor((vendor.application.reviewedAt - vendor.createdAt) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / approvedVendors.length
      : 0;

    // Document metrics
    const allVendors = await Vendor.find();
    const allDocuments = allVendors.flatMap(vendor => vendor.documents);
    const totalDocuments = allDocuments.length;
    const approvedDocuments = allDocuments.filter(doc => doc.status === 'approved').length;
    const rejectedDocuments = allDocuments.filter(doc => doc.status === 'rejected').length;
    const pendingDocuments = allDocuments.filter(doc => doc.status === 'pending').length;
    const approvalRate = totalDocuments > 0 ? (approvedDocuments / totalDocuments) * 100 : 0;
    
    // Calculate average processing time for approved documents
    const processedDocs = allDocuments.filter(doc => doc.reviewedAt && doc.uploadedAt);
    const avgProcessingTime = processedDocs.length > 0
      ? processedDocs.reduce((sum, doc) => {
          const days = Math.floor((doc.reviewedAt - doc.uploadedAt) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / processedDocs.length
      : 0;

    // Candidate metrics
    const totalCandidates = await Candidate.countDocuments({
      createdAt: { $gte: startDate }
    });
    const hiredCandidates = await Candidate.countDocuments({
      status: 'hired',
      createdAt: { $gte: startDate }
    });
    const placementRate = totalCandidates > 0 ? (hiredCandidates / totalCandidates) * 100 : 0;

    // Monthly submissions data (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(now.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthStart.getMonth() + 1);
      
      const submissions = await Candidate.countDocuments({
        createdAt: { $gte: monthStart, $lt: monthEnd }
      });
      
      const interviews = await Interview.countDocuments({
        createdAt: { $gte: monthStart, $lt: monthEnd }
      });
      
      const hired = await Candidate.countDocuments({
        status: 'hired',
        createdAt: { $gte: monthStart, $lt: monthEnd }
      });
      
      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        submissions,
        interviews,
        hired
      });
    }

    // Document processing trends (last 30 days)
    const processingTrends = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      const dayDocs = allDocuments.filter(doc => {
        const uploadDate = new Date(doc.uploadedAt);
        return uploadDate >= date && uploadDate < nextDate;
      });
      
      processingTrends.push({
        date: date.toISOString(),
        approved: dayDocs.filter(doc => doc.status === 'approved').length,
        rejected: dayDocs.filter(doc => doc.status === 'rejected').length,
        pending: dayDocs.filter(doc => doc.status === 'pending').length
      });
    }

    // Vendor performance rankings
    const vendorPerformance = [];
    for (const vendor of allVendors) {
      const submissions = await Candidate.countDocuments({ vendorId: vendor._id });
      const hires = await Candidate.countDocuments({ vendorId: vendor._id, status: 'hired' });
      const rate = submissions > 0 ? (hires / submissions) * 100 : 0;
      
      if (submissions > 0) {
        vendorPerformance.push({
          vendorName: vendor.name,
          submissions,
          hires,
          rate
        });
      }
    }
    
    vendorPerformance.sort((a, b) => b.rate - a.rate);

    res.json({
      vendorMetrics: {
        totalVendors,
        activeVendors,
        avgOnboardingTime
      },
      documentMetrics: {
        totalDocuments,
        approvedDocuments,
        rejectedDocuments,
        pendingDocuments,
        approvalRate,
        avgProcessingTime
      },
      candidateMetrics: {
        totalCandidates,
        hiredCandidates,
        placementRate
      },
      performanceData: {
        monthlySubmissions: monthlyData,
        documentProcessingTrends: processingTrends,
        vendorPerformance
      }
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch analytics data',
      code: 'ANALYTICS_ERROR'
    });
  }
}));

module.exports = router;
