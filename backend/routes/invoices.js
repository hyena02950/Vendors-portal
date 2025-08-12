const express = require('express');
const Invoice = require('../models/Invoice');
const { authenticateToken, requireVendorAccess, requireRole } = require('../middleware/auth');
const { validateBody, validateQuery } = require('../middleware/validate');
const { uploadInvoiceSchema, invoiceStatusSchema, invoiceQuerySchema } = require('../validators/invoices');
const { uploadLimiter, sensitiveOperationsLimiter } = require('../middleware/rateLimiter');
const { enforceVendorScope } = require('../middleware/vendorAccess');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const fileUploadService = require('../services/fileUploadService');

const router = express.Router();

// Upload invoice
router.post('/upload', 
  authenticateToken, 
  requireVendorAccess,
  uploadLimiter,
  fileUploadService.getUploadMiddleware('invoices'),
  fileUploadService.upload.single('invoice'),
  validateBody(uploadInvoiceSchema),
  asyncHandler(async (req, res) => {
    const { invoiceNumber, jobId, candidateName, amount } = req.body;

    // Check for duplicate invoice number
    const existingInvoice = await Invoice.findOne({ 
      invoiceNumber,
      vendorId: req.vendorId 
    });

    if (existingInvoice) {
      if (req.file) {
        await fileUploadService.deleteFile(req.file.path || '');
      }
      throw new AppError('Invoice number already exists', 409, 'INVOICE_NUMBER_EXISTS');
    }

    let invoiceUrl = null;

    // Process uploaded invoice file
    if (req.file) {
      try {
        invoiceUrl = await fileUploadService.processUploadedFile(req.file, 'invoices');
        console.log('Invoice uploaded successfully:', invoiceUrl);
      } catch (error) {
        console.error('Error processing invoice upload:', error);
        throw new AppError('Failed to upload invoice file', 500, 'INVOICE_UPLOAD_ERROR');
      }
    }

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
      invoiceId: invoice._id,
      status: 'pending_approval'
    });
  })
);

// Get vendor's invoices
router.get('/my-invoices', 
  authenticateToken, 
  requireVendorAccess,
  enforceVendorScope('invoice'),
  validateQuery(invoiceQuerySchema),
  asyncHandler(async (req, res) => {
    const { page, limit, status } = req.query;
    const skip = (page - 1) * limit;

    let query = { vendorId: req.vendorId };
    if (status) {
      query.status = status;
    }

    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Invoice.countDocuments(query);

    const invoicesData = await Promise.all(invoices.map(async (invoice) => {
      let invoiceAccessUrl = null;
      if (invoice.invoiceUrl) {
        try {
          invoiceAccessUrl = await fileUploadService.getFileAccessUrl(invoice.invoiceUrl);
        } catch (error) {
          console.error('Error generating invoice access URL:', error);
        }
      }

      return {
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        jobId: invoice.jobId,
        candidateName: invoice.candidateName,
        amount: invoice.amount,
        status: invoice.status,
        uploadedDate: invoice.createdAt.toLocaleDateString(),
        approvedDate: invoice.approvedAt ? invoice.approvedAt.toLocaleDateString() : null,
        paidDate: invoice.paidAt ? invoice.paidAt.toLocaleDateString() : null,
        invoiceUrl: invoiceAccessUrl
      };
    }));

    res.json({
      invoices: invoicesData,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    });
  })
);

// Get all invoices (Admin only)
router.get('/', 
  authenticateToken, 
  requireRole(['elika_admin', 'finance_team']),
  validateQuery(invoiceQuerySchema),
  asyncHandler(async (req, res) => {
    const { page, limit, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) {
      query.status = status;
    }

    const invoices = await Invoice.find(query)
      .populate('vendorId', 'name')
      .populate('uploadedBy', 'email profile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

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
      paidDate: invoice.paidAt ? invoice.paidAt.toLocaleDateString() : null,
      vendorName: invoice.vendorId?.name || 'Unknown',
      uploadedBy: invoice.uploadedBy?.email || 'Unknown'
    }));

    res.json({
      invoices: invoicesData,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    });
  })
);

// Update invoice status (Admin only)
router.patch('/:id/status', 
  authenticateToken, 
  requireRole(['elika_admin', 'finance_team']),
  sensitiveOperationsLimiter,
  validateBody(invoiceStatusSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      throw new AppError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
    }

    invoice.status = status;
    invoice.reviewNotes = notes;
    invoice.reviewedBy = req.user._id;
    invoice.reviewedAt = new Date();

    if (status === 'approved') {
      invoice.approvedAt = new Date();
    } else if (status === 'paid') {
      invoice.paidAt = new Date();
    }

    await invoice.save();

    res.json({
      message: `Invoice ${status} successfully`
    });
  })
);

module.exports = router;