const mongoose = require('mongoose');
const User = require('../models/User');
const authService = require('../services/authService');
const env = require('../config/env');

async function setupAdmin2FA() {
  try {
    // Connect to MongoDB
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find admin users
    const adminUsers = await User.find({
      'roles.role': { $in: ['elika_admin', 'finance_team'] }
    });

    if (adminUsers.length === 0) {
      console.log('No admin users found');
      return;
    }

    console.log(`Found ${adminUsers.length} admin user(s) that require 2FA setup:`);

    for (const user of adminUsers) {
      const has2FA = await authService.has2FAEnabled(user._id);
      
      if (!has2FA) {
        console.log(`\n📧 Setting up 2FA for: ${user.email}`);
        
        try {
          const setup = await authService.setup2FA(user._id);
          
          console.log('✅ 2FA setup completed!');
          console.log('📱 QR Code URL:', setup.qrCode);
          console.log('🔑 Manual entry key:', setup.secret);
          console.log('🔐 Backup codes:');
          setup.backupCodes.forEach((code, index) => {
            console.log(`   ${index + 1}. ${code}`);
          });
          
          if (setup.required) {
            console.log('⚠️  2FA is REQUIRED for this user role');
          }
          
          console.log('\nNext steps:');
          console.log('1. Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.)');
          console.log('2. Use POST /api/auth/enable-2fa with a 6-digit code to enable 2FA');
          console.log('3. Save the backup codes in a secure location');
          
        } catch (error) {
          console.error(`❌ Failed to setup 2FA for ${user.email}:`, error.message);
        }
      } else {
        console.log(`✅ ${user.email} already has 2FA enabled`);
      }
    }

  } catch (error) {
    console.error('❌ Error setting up admin 2FA:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  setupAdmin2FA();
}

module.exports = setupAdmin2FA;