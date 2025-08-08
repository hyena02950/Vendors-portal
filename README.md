# Elika Vendor Portal

A comprehensive vendor management system for recruitment and onboarding processes.

## Architecture

- **Frontend**: React with TypeScript, Tailwind CSS, and shadcn/ui components
- **Backend**: Node.js/Express API with MongoDB
- **Authentication**: JWT-based authentication system
- **File Storage**: Local file system with organized directory structure
- **Real-time Updates**: Polling-based updates (replacing WebSocket subscriptions)

## Environment Variables

The following environment variables need to be configured:

### Frontend (.env)
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api
VITE_BACKEND_URL=http://localhost:3001

# File Upload Configuration
VITE_MAX_FILE_SIZE=10485760  # 10MB in bytes
VITE_ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,png
```

### Backend (.env)
```bash
# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:8080

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/elika-vendor-portal

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=24h

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads
ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,png

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - User logout

### Vendors
- `GET /api/vendors` - Get all vendors (admin only)
- `POST /api/vendors` - Create new vendor
- `GET /api/vendors/:id` - Get vendor details
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor
- `PATCH /api/vendors/:id/status` - Update vendor status

### Documents
- `GET /api/vendors/documents` - Get all documents for review (admin)
- `GET /api/vendors/:vendorId/documents` - Get vendor documents
- `POST /api/vendors/documents/upload` - Upload document
- `PATCH /api/vendors/documents/:id/review` - Review document
- `PATCH /api/vendors/documents/bulk-review` - Bulk review documents

### Applications
- `GET /api/vendors/applications` - Get all applications (admin)
- `GET /api/vendors/:vendorId/application` - Get vendor application
- `POST /api/vendors/:vendorId/application/submit` - Submit application
- `PATCH /api/vendors/applications/:id/status` - Update application status

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/mark-all-read` - Mark all notifications as read

### Dashboard
- `GET /api/dashboard/vendor-stats` - Get vendor dashboard statistics
- `GET /api/analytics` - Get analytics data

## Key Changes Made

### 1. Removed Supabase Dependencies
- Removed `@supabase/supabase-js` package
- Deleted Supabase client configuration
- Removed all Supabase imports and references

### 2. Replaced Authentication System
- Updated `useAuth` hook to use custom backend API
- Replaced Supabase Auth with JWT-based authentication
- Added token verification on app initialization
- Maintained compatibility with existing auth flow

### 3. Database Operations
- Replaced all Supabase queries with HTTP API calls
- Added proper error handling for API responses
- Implemented retry logic for failed requests
- Used standard REST API patterns

### 4. Real-time Updates
- Replaced Supabase real-time subscriptions with polling
- Added configurable polling intervals
- Implemented efficient data fetching strategies

### 5. File Operations
- Updated file upload to use backend API endpoints
- Maintained file validation and size limits
- Added proper error handling for file operations

### 6. New Utilities Added
- `apiClient.ts` - Centralized API client with retry logic
- Enhanced auth utilities with token verification
- Polling utilities for real-time updates

## Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the backend server:**
   ```bash
   npm run dev:backend
   ```

3. **Start the frontend development server:**
   ```bash
   npm run dev
   ```

4. **For full development (both frontend and backend):**
   ```bash
   npm run dev:full
   ```

## Production Deployment

The application is configured for deployment on AWS Lightsail with:
- Nginx as reverse proxy
- PM2 for process management
- MongoDB for data persistence
- SSL certificate support

See `deployment-guide.md` for detailed deployment instructions.

## API Response Format

All API endpoints follow a consistent response format:

**Success Response:**
```json
{
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

## Security Features

- JWT-based authentication with configurable expiration
- Rate limiting on API endpoints
- File upload validation and size limits
- CORS configuration for cross-origin requests
- Helmet.js for security headers
- Input validation and sanitization

## Monitoring and Logging

- PM2 process monitoring
- Application logs with rotation
- Error tracking and reporting
- Performance metrics collection