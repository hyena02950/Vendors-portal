const express = require('express');
const multer = require('multer');
const { authenticateToken, requireVendorAccess, requireRole } = require('../middleware/auth');

const router = express.Router();

// Configure multer for invoice uploads
const storage = multer.memoryStorage();
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

    let invoiceUrl = null;
    if (req.file) {
      // Upload invoice to Supabase storage
      const fileName = `${invoiceNumber}-${Date.now()}.pdf`;
      const filePath = `invoices/${req.vendorId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await req.supabase.storage
        .from('vendor-invoices')
        .upload(filePath, req.file.buffer, {
          contentType: 'application/pdf',
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('Invoice upload error:', uploadError);
      } else {
        const { data: { publicUrl } } = req.supabase.storage
          .from('vendor-invoices')
          .getPublicUrl(filePath);
        invoiceUrl = publicUrl;
      }
    }

    // Insert invoice record
    const { data: invoice, error: invoiceError } = await req.supabase
      .from('invoices')
      .insert({
        vendor_id: req.vendorId,
        invoice_number: invoiceNumber,
        job_id: jobId,
        candidate_name: candidateName,
        amount: parseFloat(amount),
        invoice_url: invoiceUrl,
        status: 'pending',
        uploaded_at: new Date().toISOString()
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    res.status(201).json({
      message: 'Invoice uploaded successfully',
      invoiceId: invoice.invoice_number,
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
    const offset = (page - 1) * limit;

    let query = req.supabase
      .from('invoices')
      .select('*')
      .eq('vendor_id', req.vendorId)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const invoices = data?.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      jobId: invoice.job_id,
      candidateName: invoice.candidate_name,
      amount: invoice.amount,
      status: invoice.status,
      uploadedDate: new Date(invoice.uploaded_at).toLocaleDateString(),
      approvedDate: invoice.approved_at ? new Date(invoice.approved_at).toLocaleDateString() : null,
      paidDate: invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString() : null
    })) || [];

    res.json({
      invoices,
      totalCount: count || 0,
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
      review_notes: notes || null,
      reviewed_by: req.user.id,
      reviewed_at: new Date().toISOString()
    };

    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString();
    } else if (status === 'paid') {
      updateData.paid_at = new Date().toISOString();
    }

    const { error } = await req.supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId);

    if (error) throw error;

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