const mongoose = require('mongoose');

const projectSettingsSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    unique: true
  },
  defaultCommissionRate: {
    type: Number,
    default: 0 // If 0, uses MLM standard rules
  },
  rankOverrides: [{
    rank: { type: String },
    commissionPercent: { type: Number }
  }],
  customRules: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('ProjectSettings', projectSettingsSchema);
