const express = require('express');
const path = require('path');
const fs = require('fs');
const Candidate = require('../models/Candidate');
const Invoice = require('../models/Invoice');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Download resume
router.get('/resume/:candidateId', authenticateToken, async (req, res) => {
  try {
    const { candidateId } = req.params;

    const candidate = await Candidate.findOne({ candidateId });
    if (!candidate || !candidate.resumeUrl) {
      return res.status(404).json({
        error: true,
        message: 'Resume not found',
        code: 'RESUME_NOT_FOUND'
      });
    }

    const filePath = path.join(__dirname, '../../', candidate.resumeUrl);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: true,
        message: 'Resume file not found',
        code: 'FILE_NOT_FOUND'
      });
    }

    res.download(filePath, `${candidate.name}_resume.pdf`);
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

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice || !invoice.invoiceUrl) {
      return res.status(404).json({
        error: true,
        message: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND'
      });
    }

    const filePath = path.join(__dirname, '../../', invoice.invoiceUrl);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: true,
        message: 'Invoice file not found',
        code: 'FILE_NOT_FOUND'
      });
    }

    res.download(filePath, `${invoice.invoiceNumber}.pdf`);
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