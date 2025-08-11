const express = require('express');
const path = require('path');
const fs = require('fs');
const Candidate = require('../models/Candidate');
const Invoice = require('../models/Invoice');
const { authenticateToken } = require('../middleware/auth');
const { enforceFileAccess } = require('../middleware/vendorAccess');
const fileUploadService = require('../services/fileUploadService');

const router = express.Router();

// Download resume
router.get('/resume/:candidateId', authenticateToken, enforceFileAccess, async (req, res) => {
  try {
    const { candidateId } = req.params;

    // Use candidate from middleware if available, otherwise fetch
    const candidate = req.candidate || await Candidate.findOne({ candidateId });
    if (!candidate || !candidate.resumeUrl) {
      return res.status(404).json({
        error: true,
        message: 'Resume not found',
        code: 'RESUME_NOT_FOUND'
      });
    }

    try {
      // Use file upload service to handle both local and S3 files
      const fileUrl = await fileUploadService.getFileAccessUrl(candidate.resumeUrl);
      
      if (candidate.resumeUrl.includes('amazonaws.com')) {
        // For S3 files, redirect to presigned URL
        res.redirect(fileUrl);
      } else {
        // For local files, serve securely
        const filePath = path.join(__dirname, '../../', candidate.resumeUrl);
        
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({
            error: true,
            message: 'Resume file not found',
            code: 'FILE_NOT_FOUND'
          });
        }
        
        res.download(filePath, `${candidate.name}_resume.pdf`);
      }
    } catch (fileError) {
      console.error('Error accessing resume file:', fileError);
      return res.status(500).json({
        error: true,
        message: 'Failed to access resume file',
        code: 'FILE_ACCESS_ERROR'
      });
    }
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
router.get('/invoice/:invoiceId', authenticateToken, enforceFileAccess, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Use invoice from middleware if available, otherwise fetch
    const invoice = req.invoice || await Invoice.findById(invoiceId);
    if (!invoice || !invoice.invoiceUrl) {
      return res.status(404).json({
        error: true,
        message: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND'
      });
    }

    try {
      // Use file upload service to handle both local and S3 files
      const fileUrl = await fileUploadService.getFileAccessUrl(invoice.invoiceUrl);
      
      if (invoice.invoiceUrl.includes('amazonaws.com')) {
        // For S3 files, redirect to presigned URL
        res.redirect(fileUrl);
      } else {
        // For local files, serve securely
        const filePath = path.join(__dirname, '../../', invoice.invoiceUrl);
        
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({
            error: true,
            message: 'Invoice file not found',
            code: 'FILE_NOT_FOUND'
          });
        }
        
        res.download(filePath, `${invoice.invoiceNumber}.pdf`);
      }
    } catch (fileError) {
      console.error('Error accessing invoice file:', fileError);
      return res.status(500).json({
        error: true,
        message: 'Failed to access invoice file',
        code: 'FILE_ACCESS_ERROR'
      });
    }
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