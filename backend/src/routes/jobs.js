const express = require('express');
const JobDescription = require('../models/JobDescription');
const { authenticateToken, requireVendorAccess } = require('../middleware/auth');

const router = express.Router();

// Create new job description
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      department,
      location,
      salaryRange,
      skillsRequired,
      description,
      requirements,
      experienceRequired,
      deadline
    } = req.body;

    if (!title || !location || !description) {
      return res.status(400).json({
        error: true,
        message: 'Title, location, and description are required',
        code: 'MISSING_FIELDS'
      });
    }

    const jobId = `JOB-${Date.now()}`;

    const job = new JobDescription({
      jobId,
      title,
      department,
      location,
      salaryRange,
      skillsRequired: skillsRequired || [],
      description,
      requirements,
      experienceRequired,
      deadline: deadline ? new Date(deadline) : null,
      createdBy: req.user._id
    });

    await job.save();

    res.status(201).json({
      message: 'Job description created successfully',
      job: {
        id: job._id,
        jobId: job.jobId,
        title: job.title,
        status: job.status
      }
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to create job description',
      code: 'CREATE_JOB_ERROR'
    });
  }
});

// Get assigned job descriptions for vendor
router.get('/assigned', authenticateToken, requireVendorAccess, async (req, res) => {
  try {
    const jobs = await JobDescription.find({
      assignedVendors: req.vendorId,
      status: 'active'
    }).sort({ createdAt: -1 });

    const jobsData = jobs.map(job => ({
      id: job.jobId,
      title: job.title,
      skills: job.skillsRequired || [],
      budget: job.salaryRange,
      location: job.location,
      deadline: job.deadline ? job.deadline.toISOString().split('T')[0] : 'Not specified',
      status: job.status,
      assignedDate: job.createdAt
    }));

    res.json({ jobs: jobsData });
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
    const job = await JobDescription.findOne({ jobId: req.params.id });

    if (!job) {
      return res.status(404).json({
        error: true,
        message: 'Job not found',
        code: 'JOB_NOT_FOUND'
      });
    }

    const jobData = {
      id: job.jobId,
      title: job.title,
      description: job.description,
      skills: job.skillsRequired || [],
      experience: job.experienceRequired,
      budget: job.salaryRange,
      location: job.location,
      deadline: job.deadline ? job.deadline.toISOString().split('T')[0] : 'Not specified',
      status: job.status
    };

    res.json(jobData);
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