const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: String,
    default: ''
  },
  jsonValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  label: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
