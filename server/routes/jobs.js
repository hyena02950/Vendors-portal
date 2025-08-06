const express = require('express');
const { authenticateToken, requireVendorAccess } = require('../middleware/auth');

const router = express.Router();

// Get assigned job descriptions for vendor
router.get('/assigned', authenticateToken, requireVendorAccess, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('job_descriptions')
      .select('*')
      .contains('assigned_vendors', [req.vendorId])
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const jobs = data?.map(job => ({
      id: job.job_id,
      title: job.title,
      skills: job.skills_required || [],
      budget: job.salary_range,
      location: job.location,
      deadline: job.deadline || 'Not specified',
      status: job.status,
      assignedDate: job.created_at
    })) || [];

    res.json({ jobs });
  } catch (error) {
    console.error('Error fetching assigned jobs:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch assigned jobs',
      code: 'FETCH_JOBS_ERROR'
    });
  }
});

// Get specific job description
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('job_descriptions')
      .select('*')
      .eq('job_id', req.params.id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        error: true,
        message: 'Job not found',
        code: 'JOB_NOT_FOUND'
      });
    }

    const job = {
      id: data.job_id,
      title: data.title,
      description: data.description,
      skills: data.skills_required || [],
      experience: data.experience_required,
      budget: data.salary_range,
      location: data.location,
      deadline: data.deadline || 'Not specified',
      status: data.status
    };

    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch job details',
      code: 'FETCH_JOB_ERROR'
    });
  }
});

module.exports = router;