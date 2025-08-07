const express = require('express');
const multer = require('multer');
const path = require('path');
const Candidate = require('../models/Candidate');
const JobDescription = require('../models/JobDescription');
const { authenticateToken, requireVendorAccess } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/resumes'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  }
});

// Submit candidate
router.post('/submit', authenticateToken, requireVendorAccess, upload.single('resume'), async (req, res) => {
  try {
    const {
      jobId,
      candidateName,
      email,
      phone,
      linkedIn,
      currentCTC,
      expectedCTC,
      skills,
      experience
    } = req.body;

    if (!jobId || !candidateName || !email || !phone || !experience) {
      return res.status(400).json({
        error: true,
        message: 'Missing required fields',
        code: 'MISSING_FIELDS'
      });
    }

    // Verify job exists and is assigned to vendor
    const job = await JobDescription.findOne({
      jobId,
      assignedVendors: req.vendorId
    });

    if (!job) {
      return res.status(404).json({
        error: true,
        message: 'Job not found or not assigned to your vendor',
        code: 'JOB_NOT_FOUND'
      });
    }

    const candidateId = `CAND-${Date.now()}`;
    const resumeUrl = req.file ? `/uploads/resumes/${req.file.filename}` : null;

    const candidate = new Candidate({
      candidateId,
      vendorId: req.vendorId,
      jobId: job._id,
      name: candidateName,
      email,
      phone,
      linkedinUrl: linkedIn || null,
      currentCTC: currentCTC || null,
      expectedCTC: expectedCTC || null,
      skills: skills || null,
      experienceYears: parseInt(experience),
      resumeUrl,
      submittedBy: req.user._id
    });

    await candidate.save();

    res.status(201).json({
      message: 'Candidate submitted successfully',
      candidateId: candidateId,
      submissionId: candidate._id
    });
  } catch (error) {
    console.error('Error submitting candidate:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to submit candidate',
      code: 'SUBMIT_CANDIDATE_ERROR'
    });
  }
});

// Get vendor's submitted candidates
router.get('/my-submissions', authenticateToken, requireVendorAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    let query = { vendorId: req.vendorId };
    if (status) {
      query.status = status;
    }

    const candidates = await Candidate.find(query)
      .populate('jobId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await Candidate.countDocuments(query);

    const candidatesData = candidates.map(candidate => ({
      id: candidate.candidateId,
      name: candidate.name,
      jobId: candidate.jobId.jobId || 'Unknown',
      jobTitle: candidate.jobId.title || 'Unknown Job',
      status: candidate.status,
      submittedDate: candidate.createdAt.toLocaleDateString(),
      expectedCTC: candidate.expectedCTC || 'Not specified'
    }));

    res.json({
      candidates: candidatesData,
      totalCount,
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch submissions',
      code: 'FETCH_SUBMISSIONS_ERROR'
    });
  }
});

module.exports = router;