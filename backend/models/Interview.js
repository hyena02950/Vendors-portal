const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobDescription',
    required: true
  },
  interviewDate: {
    type: Date,
    required: true
  },
  interviewType: {
    type: String,
    enum: ['technical', 'hr', 'final', 'screening'],
    required: true
  },
  interviewer: {
    type: String,
    required: true
  },
  location: String,
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled'
  },
  feedback: String,
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  recommendation: {
    type: String,
    enum: ['proceed', 'reject', 'hold']
  },
  completedAt: Date,
  scheduledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
interviewSchema.index({ vendorId: 1 });
interviewSchema.index({ candidateId: 1 });
interviewSchema.index({ interviewDate: 1 });
interviewSchema.index({ status: 1 });

module.exports = mongoose.model('Interview', interviewSchema);