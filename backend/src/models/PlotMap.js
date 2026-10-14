const mongoose = require('mongoose');

const plotMapSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false,
    default: null
  },
  mapName: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  imageS3Key: {
    type: String,
    default: ''
  },
  vectorOverlayData: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  extractedProjectMeta: {
    location: { type: String, default: '' },
    surveyNumber: { type: String, default: '' },
    village: { type: String, default: '' },
    highlights: [{ type: String }],
    amenities: [{ type: String }],
    locationAdvantages: [{
      distance: { type: String, default: '' },
      landmark: { type: String, default: '' }
    }]
  },
  processedAt: {
    type: Date,
    default: Date.now
  },
  confidenceScore: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['PENDING_REVIEW', 'APPROVED', 'REJECTED'],
    default: 'PENDING_REVIEW'
  }
}, { timestamps: true });

module.exports = mongoose.model('PlotMap', plotMapSchema);
