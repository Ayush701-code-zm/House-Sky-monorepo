const mongoose = require('mongoose');

// Admin-curated cities shown in the public website's city dropdown, location
// search suggestions and city cards. Coordinates power "nearby" search.
const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  // Lower-cased name for case-insensitive uniqueness ("Noida" == "noida")
  nameKey: {
    type: String,
    required: true,
    unique: true
  },
  state: {
    type: String,
    default: '',
    trim: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  imageS3Key: {
    type: String,
    default: ''
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

citySchema.index({ isActive: 1, order: 1, name: 1 });

module.exports = mongoose.model('City', citySchema);
