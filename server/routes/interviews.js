const express = require('express');
const { authenticateToken, requireVendorAccess } = require('../middleware/auth');

const router = express.Router();

// Get scheduled interviews for vendor
router.get('/scheduled', authenticateToken, requireVendorAccess, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('interviews')
      .select(`
        *,
        candidates!inner(name, job_id),
        job_descriptions!inner(title)
      `)
      .eq('vendor_id', req.vendorId)
      .order('interview_date', { ascending: true });

    if (error) throw error;

    const interviews = data?.map(interview => ({
      id: interview.id,
      candidateId: interview.candidate_id,
      candidateName: interview.candidates?.name || 'Unknown',
      jobId: interview.candidates?.job_id || 'Unknown',
      jobTitle: interview.job_descriptions?.title || 'Unknown Job',
      scheduledDate: interview.interview_date,
      interviewType: interview.interview_type,
      status: interview.status
    })) || [];

    res.json({ interviews });
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

    // Verify interview exists and user has access
    const { data: interview, error: interviewError } = await req.supabase
      .from('interviews')
      .select('*')
      .eq('id', interviewId)
      .single();

    if (interviewError || !interview) {
      return res.status(404).json({
        error: true,
        message: 'Interview not found',
        code: 'INTERVIEW_NOT_FOUND'
      });
    }

    // Update interview with feedback
    const { error: updateError } = await req.supabase
      .from('interviews')
      .update({
        rating: parseInt(rating),
        feedback,
        recommendation,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', interviewId);

    if (updateError) throw updateError;

    // Update candidate status based on recommendation
    if (interview.candidate_id) {
      let candidateStatus = 'interviewed';
      if (recommendation === 'proceed') {
        candidateStatus = 'shortlisted';
      } else if (recommendation === 'reject') {
        candidateStatus = 'rejected';
      }

      await req.supabase
        .from('candidates')
        .update({ status: candidateStatus })
        .eq('id', interview.candidate_id);
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