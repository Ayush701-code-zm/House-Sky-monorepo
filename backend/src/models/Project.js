const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    type: String,
    required: true
  },
  city: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  // Key selling points shown as bullet list on detail page
  highlights: [{ type: String }],
  // Location proximity advantages e.g. [{distance:'500 MTR', landmark:'Dholera Sir'}]
  locationAdvantages: [{
    distance: { type: String, default: '' },
    landmark: { type: String, default: '' }
  }],
  amenities: [{ type: String }],
  totalAreaSqft: {
    type: Number,
    required: true
  },
  // Human readable area (e.g. "25 Bigha" or "3.2 Acres")
  area: {
    type: String,
    default: ''
  },
  totalPlots: {
    type: Number,
    default: 0
  },
  // Price range string for display e.g. "₹18L – ₹45L"
  priceRange: {
    type: String,
    default: ''
  },
  launchDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['UPCOMING', 'ACTIVE', 'COMPLETED'],
    default: 'ACTIVE'
  },
  basePricePerSqft: {
    type: Number,
    required: true
  },
  bannerImage: {
    type: String,
    default: ''
  },
  // Layout / Naksha image URL shown on public detail page
  mapImageUrl: {
    type: String,
    default: ''
  },
  mapImageS3Key: {
    type: String,
    default: ''
  },
  bannerImageS3Key: {
    type: String,
    default: ''
  },
  logoImage: {
    type: String,
    default: ''
  },
  insetImage: {
    type: String,
    default: ''
  },
  gallery: [{
    url: { type: String, required: true },
    s3Key: { type: String, default: '' },
    caption: { type: String, default: '' }
  }],
  surveyNumber: {
    type: String,
    default: ''
  },
  village: {
    type: String,
    default: ''
  },
  googleMapsUrl: {
    type: String,
    default: ''
  },
  mapEmbedUrl: {
    type: String,
    default: ''
  },
  legalDocuments: [{
    title: { type: String, default: '' },
    url: { type: String, default: '' },
    s3Key: { type: String, default: '' }
  }],
  // Downloadable brochure PDF URL
  brochureUrl: {
    type: String,
    default: ''
  },
  // Promo / walkthrough video URL
  videoUrl: {
    type: String,
    default: ''
  },
  // Direct contact for this project
  contactPhone: {
    type: String,
    default: ''
  },
  contactEmail: {
    type: String,
    default: ''
  },
  // Legal: RERA number, title type etc.
  legalInfo: {
    reraNumber: { type: String, default: '' },
    titleType: { type: String, default: '' },
    approvalAuthority: { type: String, default: '' }
  },

  isDholera: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
