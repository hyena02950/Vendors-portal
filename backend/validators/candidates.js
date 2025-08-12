const Joi = require('joi');

const submitCandidateSchema = Joi.object({
  jobId: Joi.string().required(),
  candidateName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required(),
  linkedIn: Joi.string().uri().optional(),
  currentCTC: Joi.string().max(50).optional(),
  expectedCTC: Joi.string().max(50).optional(),
  skills: Joi.string().max(500).optional(),
  experience: Joi.number().min(0).max(50).required()
});

const candidateQuerySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(10),
  status: Joi.string().valid('submitted', 'shortlisted', 'rejected', 'interviewed', 'offered', 'hired').optional()
});

module.exports = {
  submitCandidateSchema,
  candidateQuerySchema
};