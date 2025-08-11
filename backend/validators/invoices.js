
const Joi = require('joi');

const uploadInvoiceSchema = Joi.object({
  invoiceNumber: Joi.string().min(1).max(50).required(),
  jobId: Joi.string().required(),
  candidateName: Joi.string().min(2).max(100).required(),
  amount: Joi.number().positive().max(10000000).required()
});

const invoiceStatusSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected', 'paid').required(),
  notes: Joi.string().max(500).optional()
});

const invoiceQuerySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(10),
  status: Joi.string().valid('pending', 'approved', 'paid', 'rejected').optional()
});

module.exports = {
  uploadInvoiceSchema,
  invoiceStatusSchema,
  invoiceQuerySchema
};
