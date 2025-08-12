const express = require('express');
const Vendor = require('../models/Vendor');
const { authenticateToken, requireRole, requireVendorAccess } = require('../middleware/auth');
const { uploadLimiter, sensitiveOperationsLimiter } = require('../middleware/rateLimiter');
const { enforceVendorScope } = require('../middleware/vendorAccess');
const fileUploadService = require('../services/fileUploadService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const router = express.Router();

// Get all vendor applications (Admin only)
router.get('/applications', 
  authenticateToken, 
  requireRole(['elika_admin', 'delivery_head']), 
  asyncHandler(async (req, res) => {
    try {
      const vendors = await Vendor.find()
        .populate('createdBy', 'email profile')
        .sort({ createdAt: -1 });

      const applications = vendors.map(vendor => {
        const totalDocuments = vendor.documents.length;
        const approvedDocuments = vendor.documents.filter(doc => doc.status === 'approved').length;
        const mandatoryDocs = ['nda', 'gst_certificate'];
        const mandatoryDocumentsApproved = mandatoryDocs.every(docType => 
          vendor.documents.some(doc => doc.documentType === docType && doc.status === 'approved')
        );

        return {
          id: vendor._id.toString(),
          vendor_id: vendor._id.toString(),
          status: vendor.application?.status || 'draft',
          submitted_at: vendor.application?.submittedAt || null,
          reviewed_at: vendor.application?.reviewedAt || null,
          reviewed_by: vendor.application?.reviewedBy || null,
          review_notes: vendor.application?.reviewNotes || null,
          created_at: vendor.createdAt,
          updated_at: vendor.updatedAt,
          vendor_name: vendor.name,
          vendor_email: vendor.email,
          vendor_status: vendor.status,
          total_documents: totalDocuments,
          approved_documents: approvedDocuments,
          mandatory_documents_approved: mandatoryDocumentsApproved
        };
      });

      res.json({
        applications
      });
    } catch (error) {
      console.error('Error fetching vendor applications:', error);
      res.status(500).json({
        error: true,
        message: 'Failed to fetch vendor applications',
        code: 'FETCH_APPLICATIONS_ERROR'
      });
    }
  })
);

// Get all documents for review (Admin only)
router.get('/documents', 
  authenticateToken, 
  requireRole(['elika_admin', 'delivery_head']), 
  asyncHandler(async (req, res) => {
    try {
      const vendors = await Vendor.find()
        .populate('createdBy', 'email profile')
        .sort({ createdAt: -1 });

      const allDocuments = [];
      
      vendors.forEach(vendor => {
        vendor.documents.forEach(doc => {
          allDocuments.push({
            id: doc._id.toString(),
            document_type: doc.documentType,
            file_name: doc.fileName,
            file_url: doc.fileUrl,
            status: doc.status,
            review_notes: doc.reviewNotes,
            uploaded_at: doc.uploadedAt,
            reviewed_at: doc.reviewedAt,
            vendor_id: vendor._id.toString(),
            vendor: {
              name: vendor.name,
              email: vendor.email
            }
          });
        });
      });

      res.json({
        documents: allDocuments
      });
    } catch (error) {
      console.error('Error fetching documents for review:', error);
      res.status(500).json({
        error: true,
        message: 'Failed to fetch documents',
        code: 'FETCH_DOCUMENTS_ERROR'
      });
    }
  })
);

// Upload document
router.post('/documents/upload', 
  authenticateToken, 
  requireVendorAccess,
  uploadLimiter,
  fileUploadService.getUploadMiddleware('documents'),
  fileUploadService.upload.single('document'),
  asyncHandler(async (req, res) => {
    const { documentType, vendorId } = req.body;

    if (!documentType) {
      if (req.file) {
        await fileUploadService.deleteFile(req.file.path || '');
      }
      throw new AppError('Document type is required', 400, 'DOCUMENT_TYPE_REQUIRED');
    }

    // Ensure vendor can only upload to their own profile
    const targetVendorId = vendorId || req.vendorId;
    if (targetVendorId !== req.vendorId.toString()) {
      if (req.file) {
        await fileUploadService.deleteFile(req.file.path || '');
      }
      throw new AppError('Access denied: Cannot upload documents for other vendors', 403, 'CROSS_VENDOR_UPLOAD_DENIED');
    }

    const vendor = await Vendor.findById(targetVendorId);
    if (!vendor) {
      if (req.file) {
        await fileUploadService.deleteFile(req.file.path || '');
      }
      throw new AppError('Vendor not found', 404, 'VENDOR_NOT_FOUND');
    }

    if (!req.file) {
      throw new AppError('No file uploaded', 400, 'NO_FILE_UPLOADED');
    }

    try {
      const fileUrl = await fileUploadService.processUploadedFile(req.file, 'documents');

      // Remove existing document of the same type
      vendor.documents = vendor.documents.filter(doc => doc.documentType !== documentType);

      // Add new document
      vendor.documents.push({
        documentType,
        fileName: req.file.originalname,
        fileUrl,
        fileSize: req.file.size,
        status: 'pending',
        uploadedAt: new Date()
      });

      await vendor.save();

      res.status(201).json({
        message: 'Document uploaded successfully',
        documentType,
        status: 'pending'
      });
    } catch (error) {
      console.error('Error processing document upload:', error);
      if (req.file) {
        await fileUploadService.deleteFile(req.file.path || '');
      }
      throw new AppError('Failed to upload document', 500, 'DOCUMENT_UPLOAD_ERROR');
    }
  })
);

// Review document (Admin only)
router.patch('/documents/:documentId/review', 
  authenticateToken, 
  requireRole(['elika_admin', 'delivery_head']),
  sensitiveOperationsLimiter,
  asyncHandler(async (req, res) => {
    const { documentId } = req.params;
    const { status, reviewNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      throw new AppError('Invalid status', 400, 'INVALID_STATUS');
    }

    const vendor = await Vendor.findOne({ 'documents._id': documentId });
    if (!vendor) {
      throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    }

    const document = vendor.documents.id(documentId);
    if (!document) {
      throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    }

    document.status = status;
    document.reviewNotes = reviewNotes;
    document.reviewedBy = req.user._id;
    document.reviewedAt = new Date();

    await vendor.save();

    res.json({
      message: `Document ${status} successfully`
    });
  })
);

// Bulk review documents (Admin only)
router.patch('/documents/bulk-review', 
  authenticateToken, 
  requireRole(['elika_admin', 'delivery_head']),
  sensitiveOperationsLimiter,
  asyncHandler(async (req, res) => {
    const { documentIds, status, reviewNotes } = req.body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      throw new AppError('Document IDs array is required', 400, 'DOCUMENT_IDS_REQUIRED');
    }

    if (!['approved', 'rejected'].includes(status)) {
      throw new AppError('Invalid status', 400, 'INVALID_STATUS');
    }

    let updatedCount = 0;

    for (const documentId of documentIds) {
      try {
        const vendor = await Vendor.findOne({ 'documents._id': documentId });
        if (vendor) {
          const document = vendor.documents.id(documentId);
          if (document && document.status === 'pending') {
            document.status = status;
            document.reviewNotes = reviewNotes;
            document.reviewedBy = req.user._id;
            document.reviewedAt = new Date();
            await vendor.save();
            updatedCount++;
          }
        }
      } catch (error) {
        console.error(`Error updating document ${documentId}:`, error);
      }
    }

    res.json({
      message: `${updatedCount} documents ${status} successfully`,
      updatedCount
    });
  })
);

module.exports = router;