const mongoose = require('mongoose');

const jobDescriptionSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  department: String,
  location: {
    type: String,
    required: true
  },
  salaryRange: String,
  skillsRequired: [String],
  description: {
    type: String,
    required: true
  },
  requirements: String,
  experienceRequired: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'active'
  },
  assignedVendors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  }],
  deadline: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
jobDescriptionSchema.index({ jobId: 1 });
jobDescriptionSchema.index({ status: 1 });
jobDescriptionSchema.index({ assignedVendors: 1 });

module.exports = mongoose.model('JobDescription', jobDescriptionSchema);