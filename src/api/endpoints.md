# API Endpoints for Elika Vendor Portal Backend

## Authentication Endpoints

### POST /api/auth/login
**Request:**
```json
{
  "email": "vendor@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "vendor@example.com",
    "role": "vendor_recruiter|vendor_admin|elika_admin|finance",
    "vendorId": "vendor_id",
    "name": "User Name"
  }
}
```

### POST /api/auth/logout
**Headers:** `Authorization: Bearer {token}`
**Response:** `{ "message": "Logged out successfully" }`

## Job Description Endpoints

### GET /api/jd/assigned
**Headers:** `Authorization: Bearer {token}`
**Response:**
```json
{
  "jobs": [
    {
      "id": "JD-001",
      "title": "Senior React Developer",
      "skills": ["React", "TypeScript", "Node.js"],
      "budget": "12-15 LPA",
      "location": "Bangalore",
      "deadline": "2024-02-15",
      "status": "active",
      "assignedDate": "2024-01-15"
    }
  ]
}
```

### GET /api/jd/{id}
**Headers:** `Authorization: Bearer {token}`
**Response:**
```json
{
  "id": "JD-001",
  "title": "Senior React Developer",
  "description": "We are looking for...",
  "skills": ["React", "TypeScript", "Node.js"],
  "experience": "3-5 years",
  "budget": "12-15 LPA",
  "location": "Bangalore",
  "deadline": "2024-02-15",
  "status": "active"
}
```

## Candidate Submission Endpoints

### POST /api/candidates/submit
**Headers:** 
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

**Request (FormData):**
```
jobId: "JD-001"
candidateName: "John Doe"
email: "john@example.com"
phone: "+91-9876543210"
linkedIn: "https://linkedin.com/in/johndoe"
currentCTC: "12"
expectedCTC: "15"
skills: "React, Node.js, TypeScript"
experience: "5"
resume: [File object]
```

**Response:**
```json
{
  "message": "Candidate submitted successfully",
  "candidateId": "CAND-001",
  "submissionId": "SUB-001"
}
```

### GET /api/candidates/my-submissions
**Headers:** `Authorization: Bearer {token}`
**Query:** `?page=1&limit=10&status=pending|shortlisted|rejected`
**Response:**
```json
{
  "candidates": [
    {
      "id": "CAND-001",
      "name": "John Doe",
      "jobId": "JD-001",
      "jobTitle": "Senior React Developer",
      "status": "pending|shortlisted|rejected|interviewed|offered|joined",
      "submittedDate": "2024-01-20",
      "expectedCTC": "15 LPA"
    }
  ],
  "totalCount": 25,
  "currentPage": 1
}
```

## Interview & Feedback Endpoints

### GET /api/interviews/scheduled
**Headers:** `Authorization: Bearer {token}`
**Response:**
```json
{
  "interviews": [
    {
      "id": "INT-001",
      "candidateId": "CAND-001",
      "candidateName": "John Doe",
      "jobId": "JD-001",
      "jobTitle": "Senior React Developer",
      "scheduledDate": "2024-01-25T10:00:00Z",
      "interviewType": "technical|hr|final",
      "status": "scheduled|completed|cancelled"
    }
  ]
}
```

### POST /api/interviews/{id}/feedback
**Headers:** `Authorization: Bearer {token}`
**Request:**
```json
{
  "rating": 4,
  "feedback": "Good technical skills, needs improvement in communication",
  "recommendation": "proceed|reject|hold"
}
```

## Invoice Management Endpoints

### POST /api/invoices/upload
**Headers:** 
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

**Request (FormData):**
```
invoiceNumber: "INV-001"
jobId: "JD-001"
candidateName: "John Doe"
amount: "50000"
invoice: [File object - PDF]
```

**Response:**
```json
{
  "message": "Invoice uploaded successfully",
  "invoiceId": "INV-001",
  "status": "pending_approval"
}
```

### GET /api/invoices/my-invoices
**Headers:** `Authorization: Bearer {token}`
**Query:** `?page=1&limit=10&status=pending|approved|paid|rejected`
**Response:**
```json
{
  "invoices": [
    {
      "id": "INV-001",
      "invoiceNumber": "INV-001",
      "jobId": "JD-001",
      "candidateName": "John Doe",
      "amount": 50000,
      "status": "pending|approved|paid|rejected",
      "uploadedDate": "2024-01-20",
      "approvedDate": "2024-01-22",
      "paidDate": null
    }
  ],
  "totalCount": 15,
  "currentPage": 1
}
```

## Dashboard Analytics Endpoints

### GET /api/dashboard/vendor-stats
**Headers:** `Authorization: Bearer {token}`
**Response:**
```json
{
  "activeJobs": 5,
  "totalSubmissions": 23,
  "shortlistedCandidates": 8,
  "pendingInterviews": 3,
  "completedJoins": 2,
  "pendingInvoices": 2,
  "totalEarnings": 150000,
  "thisMonthEarnings": 50000
}
```

### GET /api/dashboard/recent-activity
**Headers:** `Authorization: Bearer {token}`
**Response:**
```json
{
  "activities": [
    {
      "id": "ACT-001",
      "type": "candidate_submitted|interview_scheduled|invoice_approved",
      "description": "Candidate John Doe submitted for JD-001",
      "timestamp": "2024-01-20T14:30:00Z",
      "relatedId": "CAND-001"
    }
  ]
}
```

## File Upload/Download Endpoints

### GET /api/files/resume/{candidateId}
**Headers:** `Authorization: Bearer {token}`
**Response:** Binary file download

### GET /api/files/invoice/{invoiceId}
**Headers:** `Authorization: Bearer {token}`
**Response:** Binary file download

## Error Response Format
All endpoints should return errors in this format:
```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {} // Optional additional details
}
```

## Authentication Notes
- Include JWT token in Authorization header: `Bearer {token}`
- Token should contain user ID, role, and vendor ID
- Implement role-based access control (RBAC)
- Token expiry should be handled gracefully

## File Handling Notes
- Resume uploads: Accept PDF, DOC, DOCX (max 5MB)
- Invoice uploads: Accept PDF only (max 10MB)
- Implement virus scanning for uploaded files
- Auto-watermark resumes with vendor information
- Store files securely with access controls