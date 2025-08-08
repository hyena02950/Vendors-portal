const express = require('express');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/vendor-documents');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Create new vendor
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, address, contactPerson } = req.body;

    if (!name || !email || !contactPerson) {
      return res.status(400).json({
        error: true,
        message: 'Name, email, and contact person are required',
        code: 'MISSING_FIELDS'
      });
    }

    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor) {
      return res.status(400).json({
        error: true,
        message: 'Vendor with this email already exists',
        code: 'VENDOR_EXISTS'
      });
    }

    const vendor = new Vendor({
      name,
      email,
      phone,
      address,
      contactPerson,
      createdBy: req.user._id
    });

    await vendor.save();

    req.user.roles.push({
      role: 'vendor_admin',
      vendorId: vendor._id
    });
    await req.user.save();

    res.status(201).json({
      message: 'Vendor created successfully',
      vendor: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        status: vendor.status
      }
    });
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to create vendor',
      code: 'CREATE_VENDOR_ERROR'
    });
  }
});

// Get all vendors (admin only)
router.get('/', authenticateToken, requireRole(['elika_admin', 'delivery_head']), async (req, res) => {
  try {
    const vendors = await Vendor.find()
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 });

    res.json({ vendors });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch vendors',
      code: 'FETCH_VENDORS_ERROR'
    });
  }
});

// Get vendor by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('documents.reviewedBy', 'name email');

    if (!vendor) {
      return res.status(404).json({
        error: true,
        message: 'Vendor not found',
        code: 'VENDOR_NOT_FOUND'
      });
    }

    res.json({ vendor });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch vendor',
      code: 'FETCH_VENDOR_ERROR'
    });
  }
});

// Update vendor status (admin only)
router.patch('/:id/status', authenticateToken, requireRole(['elika_admin']), async (req, res) => {
  try {
    const { status } = req.body;
    const vendorId = req.params.id;

    if (!['pending', 'active', 'inactive', 'rejected'].includes(status)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid status',
        code: 'INVALID_STATUS'
      });
    }

    const vendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!vendor) {
      return res.status(404).json({
        error: true,
        message: 'Vendor not found',
        code: 'VENDOR_NOT_FOUND'
      });
    }

    res.json({ message: `Vendor status updated to ${status}` });
  } catch (error) {
    console.error('Error updating vendor status:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update vendor status',
      code: 'UPDATE_VENDOR_ERROR'
    });
  }
});

// Document Management Endpoints
router.get('/:vendorId/documents', authenticateToken, async (req, res) => {
  try {
    const { type } = req.query;
    const vendor = await Vendor.findById(req.params.vendorId)
      .select('documents')
      .populate('documents.reviewedBy', 'name email');

    if (!vendor) {
      return res.status(404).json({
        error: true,
        message: 'Vendor not found',
        code: 'VENDOR_NOT_FOUND'
      });
    }

    let documents = vendor.documents;

    if (type) {
      documents = documents.filter(doc => doc.documentType === type);
    }

    // Sort by upload date (newest first)
    documents.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    res.json({ documents });
  } catch (error) {
    console.error('Error fetching vendor documents:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch vendor documents',
      code: 'FETCH_DOCUMENTS_ERROR'
    });
  }
});

router.post('/:vendorId/documents', 
  authenticateToken,
  upload.single('document'),
  async (req, res) => {
    try {
      const { documentType, reviewNotes } = req.body;
      const { vendorId } = req.params;

      if (!req.file) {
        return res.status(400).json({
          error: true,
          message: 'No file uploaded',
          code: 'NO_FILE_UPLOADED'
        });
      }

      if (!documentType) {
        return res.status(400).json({
          error: true,
          message: 'Document type is required',
          code: 'MISSING_DOCUMENT_TYPE'
        });
      }

      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(404).json({
          error: true,
          message: 'Vendor not found',
          code: 'VENDOR_NOT_FOUND'
        });
      }

      const newDocument = {
        documentType,
        fileName: req.file.originalname,
        fileUrl: `/uploads/vendor-documents/${req.file.filename}`,
        fileSize: req.file.size,
        status: 'pending',
        reviewNotes,
        uploadedAt: new Date()
      };

      vendor.documents.push(newDocument);
      await vendor.save();

      res.status(201).json({
        message: 'Document uploaded successfully',
        document: newDocument
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({
        error: true,
        message: 'Failed to upload document',
        code: 'UPLOAD_DOCUMENT_ERROR'
      });
    }
  }
);

router.patch('/:vendorId/documents/:documentId/status', 
  authenticateToken,
  requireRole(['elika_admin', 'vendor_admin']),
  async (req, res) => {
    try {
      const { status, reviewNotes } = req.body;
      const { vendorId, documentId } = req.params;

      if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({
          error: true,
          message: 'Invalid status',
          code: 'INVALID_STATUS'
        });
      }

      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(404).json({
          error: true,
          message: 'Vendor not found',
          code: 'VENDOR_NOT_FOUND'
        });
      }

      const document = vendor.documents.id(documentId);
      if (!document) {
        return res.status(404).json({
          error: true,
          message: 'Document not found',
          code: 'DOCUMENT_NOT_FOUND'
        });
      }

      document.status = status;
      document.reviewNotes = reviewNotes;
      document.reviewedBy = req.user._id;
      document.reviewedAt = new Date();

      await vendor.save();

      res.json({
        message: 'Document status updated successfully',
        document
      });
    } catch (error) {
      console.error('Error updating document status:', error);
      res.status(500).json({
        error: true,
        message: 'Failed to update document status',
        code: 'UPDATE_DOCUMENT_ERROR'
      });
    }
  }
);

module.exports = router;