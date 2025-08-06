const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all vendors (admin only)
router.get('/', authenticateToken, requireRole(['elika_admin', 'delivery_head']), async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ vendors: data || [] });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch vendors',
      code: 'FETCH_VENDORS_ERROR'
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

    const { error } = await req.supabase
      .from('vendors')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', vendorId);

    if (error) throw error;

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

module.exports = router;