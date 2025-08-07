const express = require('express');
const multer = require('multer');
const path = require('path');
const Invoice = require('../models/Invoice');
const { authenticateToken, requireVendorAccess, requireRole } = require('../middleware/auth');

const router = express.Router();

// Configure multer for invoice uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/invoices'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for invoices.'));
    }
  }
});

// Upload invoice
router.post('/upload', authenticateToken, requireVendorAccess, upload.single('invoice'), async (req, res) => {
  try {
    const {
      invoiceNumber,
      jobId,
      candidateName,
      amount
    } = req.body;

    if (!invoiceNumber || !jobId || !candidateName || !amount) {
      return res.status(400).json({
        error: true,
        message: 'Missing required fields',
        code: 'MISSING_FIELDS'
      });
    }

    // Check if invoice number already exists
    const existingInvoice = await Invoice.findOne({ invoiceNumber });
    if (existingInvoice) {
      return res.status(400).json({
        error: true,
        message: 'Invoice number already exists',
        code: 'INVOICE_EXISTS'
      });
    }

    const invoiceUrl = req.file ? `/uploads/invoices/${req.file.filename}` : null;

    const invoice = new Invoice({
      invoiceNumber,
      vendorId: req.vendorId,
      jobId,
      candidateName,
      amount: parseFloat(amount),
      invoiceUrl,
      uploadedBy: req.user._id
    });

    await invoice.save();

    res.status(201).json({
      message: 'Invoice uploaded successfully',
      invoiceId: invoice.invoiceNumber,
      status: 'pending_approval'
    });
  } catch (error) {
    console.error('Error uploading invoice:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to upload invoice',
      code: 'UPLOAD_INVOICE_ERROR'
    });
  }
});

// Get vendor's invoices
router.get('/my-invoices', authenticateToken, requireVendorAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    let query = { vendorId: req.vendorId };
    if (status) {
      query.status = status;
    }

    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await Invoice.countDocuments(query);

    const invoicesData = invoices.map(invoice => ({
      id: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      jobId: invoice.jobId,
      candidateName: invoice.candidateName,
      amount: invoice.amount,
      status: invoice.status,
      uploadedDate: invoice.createdAt.toLocaleDateString(),
      approvedDate: invoice.approvedAt ? invoice.approvedAt.toLocaleDateString() : null,
      paidDate: invoice.paidAt ? invoice.paidAt.toLocaleDateString() : null
    }));

    res.json({
      invoices: invoicesData,
      totalCount,
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch invoices',
      code: 'FETCH_INVOICES_ERROR'
    });
  }
});

// Approve/reject invoice (admin only)
router.patch('/:id/status', authenticateToken, requireRole(['elika_admin', 'finance_team']), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const invoiceId = req.params.id;

    if (!['approved', 'rejected', 'paid'].includes(status)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid status',
        code: 'INVALID_STATUS'
      });
    }

    const updateData = {
      status,
      reviewNotes: notes || null,
      reviewedBy: req.user._id,
      reviewedAt: new Date()
    };

    if (status === 'approved') {
      updateData.approvedAt = new Date();
    } else if (status === 'paid') {
      updateData.paidAt = new Date();
    }

    const invoice = await Invoice.findByIdAndUpdate(invoiceId, updateData, { new: true });

    if (!invoice) {
      return res.status(404).json({
        error: true,
        message: 'Invoice not found',
        code: 'INVOICE_NOT_FOUND'
      });
    }

    res.json({ message: `Invoice ${status} successfully` });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update invoice status',
      code: 'UPDATE_INVOICE_ERROR'
    });
  }
});

module.exports = router;