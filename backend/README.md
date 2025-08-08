# Elika Vendor Portal Backend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
   - Set MongoDB URI
   - Set JWT secret
   - Configure other settings as needed

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Vendors
- `POST /api/vendors` - Create vendor
- `GET /api/vendors` - Get all vendors (admin only)
- `PATCH /api/vendors/:id/status` - Update vendor status (admin only)

### Jobs
- `POST /api/jobs` - Create job description
- `GET /api/jobs/assigned` - Get assigned jobs (vendor)
- `GET /api/jobs/:id` - Get specific job

### Candidates
- `POST /api/candidates/submit` - Submit candidate (with file upload)
- `GET /api/candidates/my-submissions` - Get vendor submissions

### Interviews
- `POST /api/interviews/schedule` - Schedule interview
- `GET /api/interviews/scheduled` - Get scheduled interviews
- `POST /api/interviews/:id/feedback` - Submit feedback

### Invoices
- `POST /api/invoices/upload` - Upload invoice (with file)
- `GET /api/invoices/my-invoices` - Get vendor invoices
- `PATCH /api/invoices/:id/status` - Update invoice status (admin)

### Files
- `GET /api/files/resume/:candidateId` - Download resume
- `GET /api/files/invoice/:invoiceId` - Download invoice

### Dashboard
- `GET /api/dashboard/vendor-stats` - Get vendor statistics

### Health
- `GET /api/health` - Health check endpoint

## Directory Structure

```
backend/
├── config/
│   └── database.js          # MongoDB configuration
├── middleware/
│   └── auth.js              # Authentication middleware
├── models/                  # Mongoose models
│   ├── User.js
│   ├── Vendor.js
│   ├── JobDescription.js
│   ├── Candidate.js
│   ├── Interview.js
│   └── Invoice.js
├── routes/                  # Express routes
│   ├── auth.js
│   ├── vendors.js
│   ├── jobs.js
│   ├── candidates.js
│   ├── interviews.js
│   ├── invoices.js
│   ├── files.js
│   └── dashboard.js
├── uploads/                 # File uploads
│   ├── resumes/
│   └── invoices/
├── server.js               # Main server file
├── package.json
└── .env.example
```