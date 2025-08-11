
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Import connectDB function (handling ES6 module)
const connectDB = require('./config/database').default || require('./config/database');

const app = express();

// Global error handler
process.on('uncaughtException', (error) => {
  console.error(`${new Date().toISOString()}: Uncaught Exception:`, error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`${new Date().toISOString()}: Unhandled Rejection at:`, promise, 'reason:', reason);
});

// Custom error handler middleware
const globalErrorHandler = (error, req, res, next) => {
  console.error(`${new Date().toISOString()}: Global error handler:`, error);
  
  if (res.headersSent) {
    return next(error);
  }
  
  res.status(500).json({
    error: true,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for React apps
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve React static files
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/interviews', require('./routes/interviews'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/files', require('./routes/files'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/analytics', require('./routes/analytics'));

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
