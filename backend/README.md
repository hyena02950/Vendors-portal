
# Elika Vendor Portal Backend

A robust Node.js/Express backend API for the Elika Vendor Portal with enhanced security, validation, and operational features.

## Features

### 🔐 Security
- Environment-based configuration with validation
- Enhanced CORS with configurable origins
- Comprehensive helmet security headers
- Rate limiting (general, login, and upload specific)
- Secure file uploads with type validation
- Request ID tracking for better debugging
- Protected file serving (no public uploads)

### ✅ Validation & Error Handling
- Joi-based request validation for all endpoints
- Centralized error handling with operational error classification
- Async error handling wrapper
- Detailed validation error responses
- MongoDB error normalization

### 📊 Operational Excellence
- Health check endpoints (`/health`, `/ready`)
- Graceful shutdown handling
- Enhanced logging with request IDs
- Directory auto-creation on startup
- Admin user bootstrap from environment

### 🗄️ Database
- Compound unique indexes for data integrity
- Optimized query indexes
- Connection state monitoring

### 🧪 Testing
- Jest test framework setup
- Supertest for API testing
- In-memory MongoDB for tests
- Test coverage reporting

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Required Environment Variables**
   ```env
   MONGODB_URI=mongodb://localhost:27017/elika-vendor-portal
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random-at-least-32-chars
   ELIKA_ADMIN_EMAIL=admin@elika.com
   ELIKA_ADMIN_PASSWORD=change-me-to-strong-password
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Run Tests**
   ```bash
   npm test
   npm run test:coverage
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (rate limited)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Health & Status
- `GET /health` - Basic health check
- `GET /ready` - Readiness probe (checks DB + directories)

### Candidates
- `POST /api/candidates/submit` - Submit candidate (validated, rate limited)
- `GET /api/candidates/my-submissions` - Get vendor submissions

### Jobs, Interviews, Invoices, Vendors
- Enhanced validation and error handling on all existing endpoints

## Architecture

```
backend/
├── config/
│   ├── database.js         # MongoDB connection
│   └── env.js             # Environment validation
├── middleware/
│   ├── auth.js            # Authentication middleware
│   ├── validate.js        # Request validation
│   └── requestId.js       # Request ID tracking
├── models/                # Mongoose models
├── routes/                # API routes with validation
├── utils/
│   ├── AppError.js        # Custom error class
│   └── asyncHandler.js    # Async error wrapper
├── validators/            # Joi validation schemas
├── tests/                 # Test suites
└── server.js             # Express app with enhancements
```

## Security Enhancements

- **File Upload Security**: Type validation, filename sanitization, size limits
- **Rate Limiting**: Tiered limits for different endpoint types
- **Input Validation**: Joi schemas for all request bodies/queries
- **Error Sanitization**: Secure error responses in production
- **CORS Configuration**: Environment-based origin control

## Monitoring & Debugging

- Request ID tracking for log correlation
- Enhanced error logging with context
- Health/readiness endpoints for orchestration
- Graceful shutdown for zero-downtime deployments

## Environment Variables

See `.env.example` for complete configuration options including:
- Database settings
- JWT configuration  
- Security settings
- Rate limiting configuration
- Admin bootstrap settings
- Feature flags

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure secure `JWT_SECRET` (32+ characters)
3. Set up MongoDB with authentication
4. Configure `CORS_ORIGINS` for your frontend domains
5. Set strong admin credentials
6. Enable process manager (PM2 recommended)

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Contributing

1. Add tests for new features
2. Ensure all validations use Joi schemas
3. Wrap route handlers with `asyncHandler`
4. Follow existing error handling patterns
5. Update this README for new features
