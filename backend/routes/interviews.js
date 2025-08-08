const express = require('express');
const Interview = require('../models/Interview');
const Candidate = require('../models/Candidate');
const { authenticateToken, requireVendorAccess } = require('../middleware/auth');

const router = express.Router();

// Schedule interview
router.post('/schedule', authenticateToken, requireVendorAccess, async (req, res) => {
  try {
    const {
      candidateId,
      jobId,
      interviewDate,
      interviewType,
      interviewer,
      location
    } = req.body;

    if (!candidateId || !interviewDate || !interviewType || !interviewer) {
      return res.status(400).json({
        error: true,
        message: 'Missing required fields',
        code: 'MISSING_FIELDS'
      });
    }

    const candidate = await Candidate.findOne({ candidateId });
    if (!candidate) {
      return res.status(404).json({
        error: true,
        message: 'Candidate not found',
        code: 'CANDIDATE_NOT_FOUND'
      });
    }

    const interview = new Interview({
      vendorId: req.vendorId,
      candidateId: candidate._id,
      jobId: candidate.jobId,
      interviewDate: new Date(interviewDate),
      interviewType,
      interviewer,
      location,
      scheduledBy: req.user._id
    });

    await interview.save();

    res.status(201).json({
      message: 'Interview scheduled successfully',
      interviewId: interview._id
    });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to schedule interview',
      code: 'SCHEDULE_INTERVIEW_ERROR'
    });
  }
});

// Get scheduled interviews for vendor
router.get('/scheduled', authenticateToken, requireVendorAccess, async (req, res) => {
  try {
    const interviews = await Interview.find({ vendorId: req.vendorId })
      .populate('candidateId', 'name candidateId')
      .populate('jobId', 'title jobId')
      .sort({ interviewDate: 1 });

    const interviewsData = interviews.map(interview => ({
      id: interview._id,
      candidateId: interview.candidateId.candidateId,
      candidateName: interview.candidateId.name,
      jobId: interview.jobId.jobId,
      jobTitle: interview.jobId.title,
      scheduledDate: interview.interviewDate,
      interviewType: interview.interviewType,
      status: interview.status
    }));

    res.json({ interviews: interviewsData });
  } catch (error) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch scheduled interviews',
      code: 'FETCH_INTERVIEWS_ERROR'
    });
  }
});

// Submit interview feedback
router.post('/:id/feedback', authenticateToken, async (req, res) => {
  try {
    const { rating, feedback, recommendation } = req.body;
    const interviewId = req.params.id;

    if (!rating || !feedback || !recommendation) {
      return res.status(400).json({
        error: true,
        message: 'Rating, feedback, and recommendation are required',
        code: 'MISSING_FIELDS'
      });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        error: true,
        message: 'Interview not found',
        code: 'INTERVIEW_NOT_FOUND'
      });
    }

    // Update interview with feedback
    interview.rating = parseInt(rating);
    interview.feedback = feedback;
    interview.recommendation = recommendation;
    interview.status = 'completed';
    interview.completedAt = new Date();
    await interview.save();

    // Update candidate status based on recommendation
    if (interview.candidateId) {
      let candidateStatus = 'interviewed';
      if (recommendation === 'proceed') {
        candidateStatus = 'shortlisted';
      } else if (recommendation === 'reject') {
        candidateStatus = 'rejected';
      }

      await Candidate.findByIdAndUpdate(interview.candidateId, { status: candidateStatus });
    }

    res.json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to submit feedback',
      code: 'SUBMIT_FEEDBACK_ERROR'
    });
  }
});

module.exports = router;