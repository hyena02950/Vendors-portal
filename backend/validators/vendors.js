const Joi = require('joi');

const createVendorSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
  address: Joi.string().max(200).optional(),
  contactPerson: Joi.string().min(2).max(100).required()
});

const vendorStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'active', 'inactive', 'rejected').required()
});

const documentStatusSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected', 'pending').required(),
  reviewNotes: Joi.string().max(500).optional()
});

module.exports = {
  createVendorSchema,
  vendorStatusSchema,
  documentStatusSchema
};