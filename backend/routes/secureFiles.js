const express = require('express');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const { enforceFileAccess } = require('../middleware/vendorAccess');
const fileUploadService = require('../services/fileUploadService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const router = express.Router();

// Secure document download endpoint
router.get('/documents/:vendorId/:documentId', 
  authenticateToken, 
  enforceFileAccess,
  asyncHandler(async (req, res) => {
    const { vendorId, documentId } = req.params;
    
    try {
      const Vendor = require('../models/Vendor');
      const vendor = await Vendor.findById(vendorId);
      
      if (!vendor) {
        throw new AppError('Vendor not found', 404, 'VENDOR_NOT_FOUND');
      }

      const document = vendor.documents.id(documentId);
      if (!document) {
        throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
      }

      // Get secure file access URL
      const fileUrl = await fileUploadService.getFileAccessUrl(document.fileUrl);
      
      if (document.fileUrl.includes('amazonaws.com')) {
        // For S3 files, redirect to presigned URL
        res.redirect(fileUrl);
      } else {
        // For local files, serve securely
        const filePath = path.join(__dirname, '../../', document.fileUrl);
        
        if (!fs.existsSync(filePath)) {
          throw new AppError('File not found on disk', 404, 'FILE_NOT_FOUND');
        }
        
        // Set appropriate headers
        res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        
        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
      }
    } catch (error) {
      console.error('Error serving secure document:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to serve document', 500, 'DOCUMENT_SERVE_ERROR');
    }
  })
);

module.exports = router;