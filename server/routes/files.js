const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Download resume
router.get('/resume/:candidateId', authenticateToken, async (req, res) => {
  try {
    const { candidateId } = req.params;

    // Get candidate data
    const { data: candidate, error } = await req.supabase
      .from('candidates')
      .select('resume_url, name')
      .eq('candidate_id', candidateId)
      .single();

    if (error || !candidate) {
      return res.status(404).json({
        error: true,
        message: 'Candidate not found',
        code: 'CANDIDATE_NOT_FOUND'
      });
    }

    if (!candidate.resume_url) {
      return res.status(404).json({
        error: true,
        message: 'Resume not found',
        code: 'RESUME_NOT_FOUND'
      });
    }

    // Redirect to the resume URL
    res.redirect(candidate.resume_url);
  } catch (error) {
    console.error('Error downloading resume:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to download resume',
      code: 'DOWNLOAD_RESUME_ERROR'
    });
  }
});

// Download invoice
router.get('/invoice/:invoiceId', authenticateToken, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Get invoice data
    const { data: invoice, error } = await req.supabase
      .from('invoices')
      .select('invoice_url, invoice_number')
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
      return res.status(404).json({
        error: true,
        message: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND'
      });
    }

    if (!invoice.invoice_url) {
      return res.status(404).json({
        error: true,
        message: 'Invoice file not found',
        code: 'INVOICE_FILE_NOT_FOUND'
      });
    }

    // Redirect to the invoice URL
    res.redirect(invoice.invoice_url);
  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to download invoice',
      code: 'DOWNLOAD_INVOICE_ERROR'
    });
  }
});

module.exports = router;