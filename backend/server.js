
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const { generalLimiter } = require('./middleware/rateLimiter');
const { securityHeaders, additionalHeaders } = require('./middleware/securityHeaders');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');
const env = require('./config/env');

// Load environment variables
require('dotenv').config();

// Import connectDB function (handling ES6 module)
const connectDB = require('./config/database').default || require('./config/database');

const app = express();

// Request ID middleware for tracking
const requestId = require('./middleware/requestId');
app.use(requestId);

// Security middleware
app.use(securityHeaders);
app.use(additionalHeaders);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (env.CORS_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-ID'],
  exposedHeaders: ['X-Request-ID']
};

app.use(cors(corsOptions));

// Rate limiting
app.use('/api/', generalLimiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Remove public static access to uploads for security
// Files are now served through authenticated endpoints only

// Serve React static files
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/vendors', require('./routes/vendorDocuments'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/interviews', require('./routes/interviews'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/files', require('./routes/files'));
app.use('/api/secure-files', require('./routes/secureFiles'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/analytics', require('./routes/analytics'));

// 404 handler for API routes
app.use('/api/*', notFoundHandler);

// Cleanup job for expired tokens (run every hour)
setInterval(async () => {
  try {
    const authService = require('./services/authService');
    await authService.cleanupExpiredTokens();
    console.log('Expired tokens cleaned up');
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  }
}, 60 * 60 * 1000); // 1 hour

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handling middleware (must be last)
app.use(globalErrorHandler);

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error(`${new Date().toISOString()}: Uncaught Exception:`, error);
  // In production, you might want to restart the process
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`${new Date().toISOString()}: Unhandled Rejection at:`, promise, 'reason:', reason);
  // In production, you might want to restart the process
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Start server function
const startServer = async () => {
  try {
    // Connect to database first
    console.log(`${new Date().toISOString()}: Connecting to database...`);
    await connectDB();
    console.log(`${new Date().toISOString()}: ✅ Database connected successfully`);

    const PORT = process.env.PORT || 3001;
    
    app.listen(PORT, () => {
      console.log(`${new Date().toISOString()}: ✅ Server is running on port ${PORT}`);
      console.log(`${new Date().toISOString()}: Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`${new Date().toISOString()}: Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error(`${new Date().toISOString()}: ❌ Failed to start server:`, error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
