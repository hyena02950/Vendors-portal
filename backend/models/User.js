
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  roles: [{
    role: {
      type: String,
      enum: ['vendor_admin', 'vendor_recruiter', 'elika_admin', 'delivery_head', 'finance_team'],
      required: true
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: function() {
        // Fix: Check the parent role property, not this.role
        return this.parent().roles && ['vendor_admin', 'vendor_recruiter'].includes(this.role);
      }
    }
  }],
  profile: {
    fullName: String,
    phone: String,
    companyName: String,
    contactPerson: String,
    address: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  emailVerified: {
    type: Boolean,
    default: false
  },
  tokenVersion: {
    type: Number,
    default: 0
  },
  passwordChangedAt: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true
});

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to update passwordChangedAt
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  
  this.passwordChangedAt = new Date();
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get user roles
userSchema.methods.getRoles = function() {
  return this.roles.map(r => r.role);
};

// Check if user has specific role
userSchema.methods.hasRole = function(role) {
  return this.roles.some(r => r.role === role);
};

// Get vendor ID for vendor users
userSchema.methods.getVendorId = function() {
  const vendorRole = this.roles.find(r => ['vendor_admin', 'vendor_recruiter'].includes(r.role));
  return vendorRole ? vendorRole.vendorId : null;
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

module.exports = mongoose.model('User', userSchema);
