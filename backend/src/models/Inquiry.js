const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    default: '',
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  inquiryType: {
    type: String,
    default: 'CONTACT_FORM'
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  projectName: {
    type: String,
    default: ''
  },
  plotNo: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  experienceYears: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['NEW', 'IN_PROGRESS', 'CONTACTED', 'CONVERTED', 'REJECTED'],
    default: 'NEW'
  },
  assignedAgentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  source: {
    type: String,
    default: 'LANDING_PAGE'
  }
}, { timestamps: true });

module.exports = mongoose.model('Inquiry', inquirySchema);
