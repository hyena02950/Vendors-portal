const express = require('express');
const { authenticateToken, requireVendorAccess } = require('../middleware/auth');

const router = express.Router();

// Get vendor dashboard stats
router.get('/vendor-stats', authenticateToken, requireVendorAccess, async (req, res) => {
  try {
    // Get active jobs count
    const { count: activeJobs } = await req.supabase
      .from('job_descriptions')
      .select('*', { count: 'exact', head: true })
      .contains('assigned_vendors', [req.vendorId])
      .eq('status', 'active');

    // Get total submissions
    const { count: totalSubmissions } = await req.supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', req.vendorId);

    // Get shortlisted candidates
    const { count: shortlistedCandidates } = await req.supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', req.vendorId)
      .eq('status', 'shortlisted');

    // Get pending interviews
    const { count: pendingInterviews } = await req.supabase
      .from('interviews')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', req.vendorId)
      .eq('status', 'scheduled');

    // Get completed joins
    const { count: completedJoins } = await req.supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', req.vendorId)
      .eq('status', 'hired');

    // Get pending invoices
    const { data: pendingInvoicesData, count: pendingInvoices } = await req.supabase
      .from('invoices')
      .select('amount', { count: 'exact' })
      .eq('vendor_id', req.vendorId)
      .eq('status', 'pending');

    // Calculate total earnings
    const { data: paidInvoices } = await req.supabase
      .from('invoices')
      .select('amount')
      .eq('vendor_id', req.vendorId)
      .eq('status', 'paid');

    const totalEarnings = paidInvoices?.reduce((sum, invoice) => sum + invoice.amount, 0) || 0;

    // Calculate this month earnings
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const { data: thisMonthInvoices } = await req.supabase
      .from('invoices')
      .select('amount')
      .eq('vendor_id', req.vendorId)
      .eq('status', 'paid')
      .gte('paid_at', thisMonthStart.toISOString());

    const thisMonthEarnings = thisMonthInvoices?.reduce((sum, invoice) => sum + invoice.amount, 0) || 0;

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

// Get recent activity
router.get('/recent-activity', authenticateToken, requireVendorAccess, async (req, res) => {
  try {
    // Get recent candidates
    const { data: recentCandidates } = await req.supabase
      .from('candidates')
      .select('*')
      .eq('vendor_id', req.vendorId)
      .order('submitted_at', { ascending: false })
      .limit(5);

    // Get recent interviews
    const { data: recentInterviews } = await req.supabase
      .from('interviews')
      .select('*')
      .eq('vendor_id', req.vendorId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get recent invoices
    const { data: recentInvoices } = await req.supabase
      .from('invoices')
      .select('*')
      .eq('vendor_id', req.vendorId)
      .order('uploaded_at', { ascending: false })
      .limit(5);

    const activities = [];

    // Add candidate activities
    recentCandidates?.forEach(candidate => {
      activities.push({
        id: `candidate-${candidate.id}`,
        type: 'candidate_submitted',
        description: `Candidate ${candidate.name} submitted for job ${candidate.job_id}`,
        timestamp: candidate.submitted_at,
        relatedId: candidate.candidate_id
      });
    });

    // Add interview activities
    recentInterviews?.forEach(interview => {
      activities.push({
        id: `interview-${interview.id}`,
        type: 'interview_scheduled',
        description: `Interview scheduled for ${new Date(interview.interview_date).toLocaleDateString()}`,
        timestamp: interview.created_at,
        relatedId: interview.id
      });
    });

    // Add invoice activities
    recentInvoices?.forEach(invoice => {
      let type = 'invoice_uploaded';
      let description = `Invoice ${invoice.invoice_number} uploaded`;
      
      if (invoice.status === 'approved') {
        type = 'invoice_approved';
        description = `Invoice ${invoice.invoice_number} approved`;
      }

      activities.push({
        id: `invoice-${invoice.id}`,
        type,
        description,
        timestamp: invoice.uploaded_at,
        relatedId: invoice.id
      });
    });

    // Sort by timestamp and limit to 10
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({
      activities: activities.slice(0, 10)
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch recent activity',
      code: 'FETCH_ACTIVITY_ERROR'
    });
  }
});

module.exports = router;