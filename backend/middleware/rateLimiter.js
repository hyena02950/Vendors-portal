const rateLimit = require('express-rate-limit');

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: true,
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict login rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  message: {
    error: true,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 uploads per minute
  message: {
    error: true,
    message: 'Too many upload attempts, please try again later.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Sensitive operations rate limiter (for admin actions)
const sensitiveOperationsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // limit each IP to 20 sensitive operations per 5 minutes
  message: {
    error: true,
    message: 'Too many sensitive operations from this IP, please try again later.',
    code: 'SENSITIVE_OPERATIONS_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  loginLimiter,
  uploadLimiter,
  sensitiveOperationsLimiter
};