
const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  twoFactorToken: Joi.string().length(6).optional()
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  companyName: Joi.string().min(2).max(100).optional(),
  contactPerson: Joi.string().min(2).max(100).optional()
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).required()
});

const verifyEmailSchema = Joi.object({
  token: Joi.string().required()
});

const setup2FASchema = Joi.object({
  token: Joi.string().length(6).required()
});

module.exports = {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  setup2FASchema
};
