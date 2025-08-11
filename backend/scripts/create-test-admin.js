
const mongoose = require('mongoose');
const User = require('../models/User');
const env = require('../config/env');

async function createTestAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if test admin already exists
    const existingAdmin = await User.findOne({ email: 'test-admin@elika.com' });
    
    if (existingAdmin) {
      console.log('Test admin already exists:', existingAdmin.email);
      return;
    }

    // Create test admin user
    const testAdmin = new User({
      email: 'test-admin@elika.com',
      password: 'password123',
      roles: [{ role: 'elika_admin' }],
      profile: {
        fullName: 'Test Admin',
        companyName: 'Elika',
        phone: '+1-555-0123'
      },
      emailVerified: true,
      isActive: true
    });

    await testAdmin.save();
    console.log('✅ Test admin user created successfully!');
    console.log('Email: test-admin@elika.com');
    console.log('Password: password123');

  } catch (error) {
    console.error('❌ Error creating test admin:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  createTestAdmin();
}

module.exports = createTestAdmin;
