
const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  candidateId: {
    type: String,
    required: true,
    unique: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobDescription',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  linkedinUrl: String,
  currentCTC: String,
  expectedCTC: String,
  skills: String,
  experienceYears: {
    type: Number,
    required: true
  },
  noticePeriod: {
    type: String,
    default: '30 days'
  },
  resumeUrl: String,
  status: {
    type: String,
    enum: ['submitted', 'shortlisted', 'rejected', 'interviewed', 'offered', 'hired'],
    default: 'submitted'
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
candidateSchema.index({ candidateId: 1 });
candidateSchema.index({ vendorId: 1 });
candidateSchema.index({ jobId: 1 });
candidateSchema.index({ status: 1 });
candidateSchema.index({ email: 1 });

// Compound unique index to prevent duplicate submissions
candidateSchema.index({ vendorId: 1, jobId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Candidate', candidateSchema);
