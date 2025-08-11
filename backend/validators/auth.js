
const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  companyName: Joi.string().min(2).max(100).optional(),
  contactPerson: Joi.string().min(2).max(100).optional()
});

module.exports = {
  loginSchema,
  registerSchema
};
