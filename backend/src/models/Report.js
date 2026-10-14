const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  reportType: {
    type: String,
    enum: ['REVENUE', 'COMMISSION', 'MLM_HIERARCHY', 'PLOT_SALES', 'PAYOUT_SUMMARY'],
    required: true
  },
  filters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fileUrl: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
