# Security Implementation Guide

## Overview

This document outlines the comprehensive security measures implemented in the Elika Vendor Portal to ensure data protection, access control, and system integrity.

## 🔐 Authentication & Authorization

### Multi-Factor Authentication (2FA)
- **Required for**: `elika_admin` and `finance_team` roles
- **Implementation**: TOTP-based using Speakeasy
- **Backup Codes**: 10 single-use backup codes per user
- **Setup**: Use `npm run setup-admin-2fa` script

### Token Management
- **Access Tokens**: Short-lived (15 minutes), JWT-based
- **Refresh Tokens**: Long-lived (7 days), stored in database
- **Token Rotation**: Automatic refresh token rotation after 1 day
- **Revocation**: Support for single device and all-device logout

### Account Security
- **Login Attempts**: Max 5 attempts before 2-hour lockout
- **Password Requirements**: Minimum 6 characters (enhance as needed)
- **Email Verification**: Optional but recommended for production
- **Password Reset**: Secure token-based flow with 1-hour expiry

## 🛡️ Row-Level Security (RLS)

### Vendor Data Isolation
- **Principle**: Vendors can only access their own data
- **Implementation**: Middleware-enforced scoping on all routes
- **Coverage**: Vendors, candidates, invoices, documents, files

### Access Control Matrix
```
Role                | Vendor Data Access | Cross-Vendor Access | Admin Functions
--------------------|-------------------|-------------------|----------------
vendor_admin        | Own vendor only   | ❌ Denied          | ❌ Denied
vendor_recruiter    | Own vendor only   | ❌ Denied          | ❌ Denied
elika_admin         | All vendors       | ✅ Allowed         | ✅ Full access
delivery_head       | All vendors       | ✅ Allowed         | ✅ Limited admin
finance_team        | All vendors       | ✅ Allowed         | ✅ Finance only
```

### File Access Security
- **No Public Access**: Removed static `/uploads` serving
- **Authenticated Downloads**: All file access requires authentication
- **Ownership Validation**: Files can only be accessed by authorized users
- **S3 Integration**: Presigned URLs for secure S3 file access

## 🚦 Rate Limiting

### Tiered Rate Limiting
1. **General API**: 100 requests per 15 minutes
2. **Login Endpoint**: 5 attempts per 15 minutes per IP
3. **File Uploads**: 10 uploads per minute per IP
4. **Sensitive Operations**: 20 operations per 5 minutes per IP

### Implementation
- IP-based limiting with standard headers
- Bypass successful requests for login limiter
- Custom error messages for each tier

## 🔒 Data Protection

### File Security
- **Upload Validation**: File type, size, and content validation
- **Secure Storage**: Local files served through authenticated endpoints
- **S3 Integration**: Presigned URLs with expiration
- **Filename Sanitization**: Prevent directory traversal attacks

### Input Validation
- **Joi Schemas**: Comprehensive validation for all endpoints
- **SQL Injection**: Protected by MongoDB ODM
- **XSS Prevention**: Input sanitization and CSP headers
- **CSRF Protection**: SameSite cookies and CORS restrictions

## 🌐 Network Security

### CORS Configuration
- **Allowlist-based**: Only configured origins allowed
- **Environment-specific**: Different origins for dev/prod
- **Credentials Support**: Secure cookie handling
- **Method Restrictions**: Only necessary HTTP methods allowed

### Security Headers
- **Helmet.js**: Comprehensive security header suite
- **CSP**: Content Security Policy for XSS prevention
- **HSTS**: HTTP Strict Transport Security
- **Frame Options**: Clickjacking prevention
- **No-Sniff**: MIME type sniffing prevention

## 📊 Monitoring & Logging

### Security Logging
- **Request Tracking**: Unique request IDs for correlation
- **Failed Attempts**: Login failures and rate limit violations
- **Access Violations**: Unauthorized access attempts
- **Token Events**: Token generation, refresh, and revocation

### Audit Trail
- **User Actions**: All sensitive operations logged
- **Data Changes**: Document reviews, status updates
- **Authentication Events**: Login, logout, 2FA events
- **File Access**: Download and upload activities

## 🔧 Configuration

### Environment Variables
```bash
# Security Settings
REQUIRE_EMAIL_VERIFICATION=false
ENABLE_2FA_FOR_ADMINS=true
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_TIME=7200000

# Session Configuration
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# CORS Configuration
CORS_ORIGINS=http://localhost:8080,https://your-domain.com
```

### Database Security
- **Connection Encryption**: TLS/SSL for MongoDB connections
- **Authentication**: Database user authentication required
- **Index Optimization**: Efficient queries with proper indexing
- **Data Validation**: Schema-level validation rules

## 🚀 Deployment Security

### Production Checklist
- [ ] Set strong `JWT_SECRET` (32+ characters)
- [ ] Configure `CORS_ORIGINS` for your domains
- [ ] Enable `REQUIRE_EMAIL_VERIFICATION=true`
- [ ] Set up email service integration
- [ ] Configure S3 for file storage
- [ ] Set up SSL/TLS certificates
- [ ] Enable database authentication
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Run `npm run setup-admin-2fa` for admin accounts

### Security Maintenance
- **Token Cleanup**: Automatic cleanup of expired tokens
- **Log Rotation**: Implement log rotation for disk space
- **Security Updates**: Regular dependency updates
- **Penetration Testing**: Regular security assessments
- **Backup Strategy**: Secure, encrypted backups

## 🆘 Incident Response

### Security Breach Response
1. **Immediate**: Revoke all tokens using `revokeAllUserTokens`
2. **Investigation**: Check logs for unauthorized access
3. **Communication**: Notify affected users
4. **Recovery**: Reset passwords, re-enable 2FA
5. **Prevention**: Update security measures

### Emergency Procedures
- **Mass Token Revocation**: Update `tokenVersion` for all users
- **Account Lockdown**: Disable user accounts if compromised
- **File Access Revocation**: Remove S3 access or move files
- **Database Isolation**: Isolate affected data if needed

## 📋 Security Testing

### Automated Tests
- Authentication flow testing
- Authorization boundary testing
- Rate limiting validation
- Input validation testing
- File upload security testing

### Manual Testing
- Cross-tenant access attempts
- Token manipulation testing
- File access boundary testing
- CORS policy validation
- Rate limiting effectiveness

## 🔍 Security Monitoring

### Key Metrics
- Failed login attempts per IP/user
- Rate limiting violations
- Cross-tenant access attempts
- File access patterns
- Token refresh frequency

### Alerting Thresholds
- More than 10 failed logins per hour
- Rate limit violations exceeding 100/hour
- Any cross-tenant access attempts
- Unusual file download patterns
- Multiple token refresh failures

This security implementation provides enterprise-grade protection while maintaining usability and performance.