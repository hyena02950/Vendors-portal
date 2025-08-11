// Email service for sending verification and reset emails
// In a production environment, integrate with services like SendGrid, AWS SES, or similar

class EmailService {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@elika.com';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
  }

  // Send email verification
  async sendEmailVerification(email, token, userName = '') {
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;
    
    const subject = 'Verify Your Email - Elika Vendor Portal';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Elika Vendor Portal!</h2>
        <p>Hello ${userName || 'there'},</p>
        <p>Thank you for registering with Elika Vendor Portal. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
        <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
          This verification link will expire in 24 hours. If you didn't create an account with us, please ignore this email.
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #9ca3af;">
          © 2024 Elika Vendor Portal. All rights reserved.
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  // Send password reset email
  async sendPasswordReset(email, token, userName = '') {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;
    
    const subject = 'Reset Your Password - Elika Vendor Portal';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>Hello ${userName || 'there'},</p>
        <p>We received a request to reset your password for your Elika Vendor Portal account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
        <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
          This reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #9ca3af;">
          © 2024 Elika Vendor Portal. All rights reserved.
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  // Send 2FA setup notification
  async send2FASetupNotification(email, userName = '') {
    const subject = '2FA Enabled - Elika Vendor Portal';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Two-Factor Authentication Enabled</h2>
        <p>Hello ${userName || 'there'},</p>
        <p>Two-factor authentication has been successfully enabled for your Elika Vendor Portal account.</p>
        <p>Your account is now more secure. You'll need to provide a 2FA code when signing in.</p>
        <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #065f46;">
            <strong>Security Tip:</strong> Keep your backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
          </p>
        </div>
        <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
          If you didn't enable 2FA, please contact support immediately.
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #9ca3af;">
          © 2024 Elika Vendor Portal. All rights reserved.
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  // Generic email sending method
  async sendEmail(to, subject, html) {
    if (!this.isProduction) {
      // In development, just log the email
      console.log('\n=== EMAIL NOTIFICATION ===');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`HTML: ${html}`);
      console.log('=========================\n');
      return { success: true, messageId: 'dev-mode' };
    }

    // In production, integrate with your email service
    // Example with AWS SES, SendGrid, etc.
    try {
      // TODO: Implement actual email sending
      // const result = await this.emailProvider.send({
      //   from: this.fromEmail,
      //   to,
      //   subject,
      //   html
      // });
      
      console.log(`Email would be sent to ${to}: ${subject}`);
      return { success: true, messageId: 'production-placeholder' };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }
}

module.exports = new EmailService();