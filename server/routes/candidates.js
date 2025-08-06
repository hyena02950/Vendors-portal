const express = require('express');
const multer = require('multer');
const { authenticateToken, requireVendorAccess } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
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
    const { data: job, error: jobError } = await req.supabase
      .from('job_descriptions')
      .select('*')
      .eq('job_id', jobId)
      .contains('assigned_vendors', [req.vendorId])
      .single();

    if (jobError || !job) {
      return res.status(404).json({
        error: true,
        message: 'Job not found or not assigned to your vendor',
        code: 'JOB_NOT_FOUND'
      });
    }

    let resumeUrl = null;
    if (req.file) {
      // Upload resume to Supabase storage
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const filePath = `resumes/${req.vendorId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await req.supabase.storage
        .from('candidate-resumes')
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('Resume upload error:', uploadError);
      } else {
        const { data: { publicUrl } } = req.supabase.storage
          .from('candidate-resumes')
          .getPublicUrl(filePath);
        resumeUrl = publicUrl;
      }
    }

    // Insert candidate
    const candidateId = `CAND-${Date.now()}`;
    const { data: candidate, error: candidateError } = await req.supabase
      .from('candidates')
      .insert({
        candidate_id: candidateId,
        vendor_id: req.vendorId,
        job_id: jobId,
        name: candidateName,
        email,
        phone,
        linkedin_url: linkedIn || null,
        current_ctc: currentCTC || null,
        expected_ctc: expectedCTC || null,
        skills: skills || null,
        experience_years: parseInt(experience),
        resume_url: resumeUrl,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (candidateError) throw candidateError;

    res.status(201).json({
      message: 'Candidate submitted successfully',
      candidateId: candidateId,
      submissionId: candidate.id
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
    const offset = (page - 1) * limit;

    let query = req.supabase
      .from('candidates')
      .select(`
        *,
        job_descriptions!inner(title)
      `)
      .eq('vendor_id', req.vendorId)
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const candidates = data?.map(candidate => ({
      id: candidate.candidate_id,
      name: candidate.name,
      jobId: candidate.job_id,
      jobTitle: candidate.job_descriptions?.title || 'Unknown Job',
      status: candidate.status,
      submittedDate: new Date(candidate.submitted_at).toLocaleDateString(),
      expectedCTC: candidate.expected_ctc || 'Not specified'
    })) || [];

    res.json({
      candidates,
      totalCount: count || 0,
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