
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { loginSchema, registerSchema } = require('../validators/auth');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/register
router.post('/register', asyncHandler(async (req, res) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: true,
      message: error.details[0].message,
      code: 'VALIDATION_ERROR'
    });
  }

  const { email, password, companyName, contactPerson } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({
      error: true,
      message: 'User already exists with this email',
      code: 'USER_EXISTS'
    });
  }

  // Create new user with NO roles initially - roles will be assigned after vendor creation
  const user = new User({
    email: email.toLowerCase(),
    password,
    roles: [], // Start with empty roles array
    profile: {
      companyName: companyName || '',
      contactPerson: contactPerson || email.split('@')[0],
      fullName: contactPerson || email.split('@')[0]
    }
  });

  await user.save();

  // Generate token
  const token = generateToken(user._id);

  // Return user data without password
  const userData = {
    id: user._id.toString(),
    email: user.email,
    roles: user.roles,
    profile: user.profile
  };

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: userData
  });
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: true,
      message: error.details[0].message,
      code: 'VALIDATION_ERROR'
    });
  }

  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.isActive) {
    return res.status(401).json({
      error: true,
      message: 'Invalid email or password',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      error: true,
      message: 'Invalid email or password',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  // Return user data without password
  const userData = {
    id: user._id.toString(),
    email: user.email,
    roles: user.roles,
    profile: user.profile
  };

  res.json({
    message: 'Login successful',
    token,
    user: userData
  });
}));

// POST /api/auth/logout
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  // For JWT tokens, logout is handled client-side by removing the token
  res.json({
    message: 'Logout successful'
  });
}));

// GET /api/auth/me
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  
  if (!user || !user.isActive) {
    return res.status(401).json({
      error: true,
      message: 'User not found or inactive',
      code: 'USER_NOT_FOUND'
    });
  }

  const userData = {
    id: user._id.toString(),
    email: user.email,
    roles: user.roles,
    profile: user.profile
  };

  res.json({
    user: userData
  });
}));

module.exports = router;
