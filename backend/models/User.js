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
        return ['vendor_admin', 'vendor_recruiter'].includes(this.role);
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
  }
}, {
  timestamps: true
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

module.exports = mongoose.model('User', userSchema);