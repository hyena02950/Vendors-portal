
const express = require('express');
const Candidate = require('../models/Candidate');
const JobDescription = require('../models/JobDescription');
const { authenticateToken, requireVendorAccess } = require('../middleware/auth');
const { validateBody, validateQuery } = require('../middleware/validate');
const { submitCandidateSchema, candidateQuerySchema } = require('../validators/candidates');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const fileUploadService = require('../services/fileUploadService');

const router = express.Router();

// Submit candidate
router.post('/submit', 
  authenticateToken, 
  requireVendorAccess,
  fileUploadService.getUploadMiddleware('resumes'),
  fileUploadService.upload.single('resume'),
  validateBody(submitCandidateSchema),
  asyncHandler(async (req, res) => {
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

    // Verify job exists and is assigned to vendor
    const job = await JobDescription.findOne({
      jobId,
      assignedVendors: req.vendorId
    });

    if (!job) {
      // Clean up uploaded file if job not found
      if (req.file) {
        await fileUploadService.deleteFile(req.file.path || '');
      }
      throw new AppError('Job not found or not assigned to your vendor', 404, 'JOB_NOT_FOUND');
    }

    // Check for duplicate submission
    const existingCandidate = await Candidate.findOne({
      vendorId: req.vendorId,
      jobId: job._id,
      email
    });

    if (existingCandidate) {
      // Clean up uploaded file if duplicate
      if (req.file) {
        await fileUploadService.deleteFile(req.file.path || '');
      }
      throw new AppError('Candidate already submitted for this job', 409, 'CANDIDATE_ALREADY_SUBMITTED');
    }

    const candidateId = `CAND-${Date.now()}`;
    let resumeUrl = null;

    // Process uploaded resume
    if (req.file) {
      try {
        resumeUrl = await fileUploadService.processUploadedFile(req.file, 'resumes');
        console.log('Resume uploaded successfully:', resumeUrl);
      } catch (error) {
        console.error('Error processing resume upload:', error);
        throw new AppError('Failed to upload resume', 500, 'RESUME_UPLOAD_ERROR');
      }
    }

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
  })
);

// Get vendor's submitted candidates
router.get('/my-submissions', 
  authenticateToken, 
  requireVendorAccess,
  validateQuery(candidateQuerySchema),
  asyncHandler(async (req, res) => {
    const { page, limit, status } = req.query;
    const skip = (page - 1) * limit;

    let query = { vendorId: req.vendorId };
    if (status) {
      query.status = status;
    }

    const candidates = await Candidate.find(query)
      .populate('jobId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Candidate.countDocuments(query);

    const candidatesData = await Promise.all(candidates.map(async (candidate) => {
      let resumeAccessUrl = null;
      if (candidate.resumeUrl) {
        try {
          resumeAccessUrl = await fileUploadService.getFileAccessUrl(candidate.resumeUrl);
        } catch (error) {
          console.error('Error generating resume access URL:', error);
        }
      }

      return {
        id: candidate.candidateId,
        name: candidate.name,
        jobId: candidate.jobId?.jobId || 'Unknown',
        jobTitle: candidate.jobId?.title || 'Unknown Job',
        status: candidate.status,
        submittedDate: candidate.createdAt.toLocaleDateString(),
        expectedCTC: candidate.expectedCTC || 'Not specified',
        resumeUrl: resumeAccessUrl
      };
    }));

    res.json({
      candidates: candidatesData,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    });
  })
);

module.exports = router;
