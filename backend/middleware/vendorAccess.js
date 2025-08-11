const Vendor = require('../models/Vendor');
const Candidate = require('../models/Candidate');
const Invoice = require('../models/Invoice');
const AppError = require('../utils/AppError');

// Middleware to ensure vendor users can only access their own data
const enforceVendorScope = (resourceType) => {
  return async (req, res, next) => {
    try {
      const userRoles = req.userRoles || [];
      const isVendorUser = userRoles.some(role => 
        ['vendor_admin', 'vendor_recruiter'].includes(role.role)
      );
      const isElikaUser = userRoles.some(role => 
        ['elika_admin', 'delivery_head', 'finance_team'].includes(role.role)
      );

      // Elika users have access to all data
      if (isElikaUser) {
        return next();
      }

      // Vendor users must have vendorId and can only access their own data
      if (!isVendorUser || !req.vendorId) {
        throw new AppError('Access denied: Vendor access required', 403, 'VENDOR_ACCESS_DENIED');
      }

      // Add vendor scope validation based on resource type
      switch (resourceType) {
        case 'vendor':
          // For vendor resources, ensure the vendor ID matches
          const vendorId = req.params.id || req.params.vendorId;
          if (vendorId && vendorId !== req.vendorId.toString()) {
            throw new AppError('Access denied: Cannot access other vendor data', 403, 'CROSS_VENDOR_ACCESS_DENIED');
          }
          break;

        case 'candidate':
          // For candidate resources, verify the candidate belongs to the vendor
          const candidateId = req.params.candidateId || req.params.id;
          if (candidateId) {
            const candidate = await Candidate.findOne({ candidateId });
            if (!candidate || candidate.vendorId.toString() !== req.vendorId.toString()) {
              throw new AppError('Access denied: Candidate not found or not owned by vendor', 403, 'CANDIDATE_ACCESS_DENIED');
            }
            req.candidate = candidate;
          }
          break;

        case 'invoice':
          // For invoice resources, verify the invoice belongs to the vendor
          const invoiceId = req.params.invoiceId || req.params.id;
          if (invoiceId) {
            const invoice = await Invoice.findById(invoiceId);
            if (!invoice || invoice.vendorId.toString() !== req.vendorId.toString()) {
              throw new AppError('Access denied: Invoice not found or not owned by vendor', 403, 'INVOICE_ACCESS_DENIED');
            }
            req.invoice = invoice;
          }
          break;

        default:
          // For other resources, just ensure vendor scope is set
          break;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware to check file ownership before allowing download
const enforceFileAccess = async (req, res, next) => {
  try {
    const userRoles = req.userRoles || [];
    const isElikaUser = userRoles.some(role => 
      ['elika_admin', 'delivery_head', 'finance_team'].includes(role.role)
    );

    // Elika users have access to all files
    if (isElikaUser) {
      return next();
    }

    // Vendor users must have vendorId
    if (!req.vendorId) {
      throw new AppError('Access denied: Vendor access required', 403, 'VENDOR_ACCESS_REQUIRED');
    }

    // Check file ownership based on route
    const { candidateId, invoiceId } = req.params;

    if (candidateId) {
      const candidate = await Candidate.findOne({ candidateId });
      if (!candidate || candidate.vendorId.toString() !== req.vendorId.toString()) {
        throw new AppError('Access denied: Resume not found or not accessible', 403, 'RESUME_ACCESS_DENIED');
      }
      req.candidate = candidate;
    }

    if (invoiceId) {
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice || invoice.vendorId.toString() !== req.vendorId.toString()) {
        throw new AppError('Access denied: Invoice not found or not accessible', 403, 'INVOICE_ACCESS_DENIED');
      }
      req.invoice = invoice;
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  enforceVendorScope,
  enforceFileAccess
};