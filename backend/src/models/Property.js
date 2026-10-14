const mongoose = require('mongoose');

const PROPERTY_TYPES = [
  'RESIDENTIAL_PLOT',
  'COMMERCIAL',
  'VILLA',
  'SHOWROOM',
  'APARTMENT',
  'STUDIO_APARTMENT',
  'LAND'
];

const LISTING_TYPES = ['SALE', 'RENT', 'LEASE'];

const PROPERTY_STATUSES = ['AVAILABLE', 'BOOKED', 'SOLD', 'UPCOMING'];

const galleryItemSchema = new mongoose.Schema({
  url: { type: String, required: true },
  s3Key: { type: String, default: '' },
  caption: { type: String, default: '' }
}, { _id: false });

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  tagline: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  propertyType: {
    type: String,
    enum: PROPERTY_TYPES,
    default: 'RESIDENTIAL_PLOT'
  },
  listingType: {
    type: String,
    enum: LISTING_TYPES,
    default: 'SALE'
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  location: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  area: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  village: {
    type: String,
    default: ''
  },
  surveyNumber: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    default: 0
  },
  pricePerSqft: {
    type: Number,
    default: 0
  },
  priceRange: {
    type: String,
    default: ''
  },
  areaSqft: {
    type: Number,
    default: 0
  },
  areaSqYrd: {
    type: Number,
    default: 0
  },
  dimensions: {
    type: String,
    default: ''
  },
  bedrooms: {
    type: Number,
    default: 0
  },
  bathrooms: {
    type: Number,
    default: 0
  },
  parkingSpaces: {
    type: Number,
    default: 0
  },
  highlights: [{ type: String }],
  amenities: [{ type: String }],
  features: [{ type: String }],
  heroImage: {
    type: String,
    default: ''
  },
  gallery: [galleryItemSchema],
  floorPlanUrl: {
    type: String,
    default: ''
  },
  brochureUrl: {
    type: String,
    default: ''
  },
  videoUrl: {
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
  contactPhone: {
    type: String,
    default: ''
  },
  contactEmail: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: PROPERTY_STATUSES,
    default: 'AVAILABLE'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  legalInfo: {
    reraNumber: { type: String, default: '' },
    titleType: { type: String, default: 'Freehold' },
    approvalAuthority: { type: String, default: '' }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // --- Public Submission & Approval Workflow ---
  // Default 'APPROVED' so all existing records continue to appear publicly.
  approvalStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'APPROVED'
  },
  // 'ADMIN' = created via admin panel, 'PUBLIC' = submitted via public form.
  source: {
    type: String,
    enum: ['ADMIN', 'PUBLIC'],
    default: 'ADMIN'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  submittedAt: {
    type: Date
  },

  // --- Seller Identity & Property Title KYC Verification ---
  kycInfo: {
    fullName: { type: String, default: '' },
    idType: { type: String, enum: ['PAN', 'AADHAAR', 'PASSPORT', 'VOTER_ID', 'DRIVING_LICENSE'], default: 'PAN' },
    idNumber: { type: String, default: '' },
    idDocumentUrl: { type: String, default: '' },
    idDocumentS3Key: { type: String, default: '' },
    ownershipType: { type: String, enum: ['OWNER', 'JOINT_OWNER', 'AGENT_POA', 'BUILDER'], default: 'OWNER' },
    ownershipDocumentUrl: { type: String, default: '' },
    ownershipDocumentS3Key: { type: String, default: '' },
    propertyTaxId: { type: String, default: '' },
    declarationSigned: { type: Boolean, default: false },
    verifiedStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
    submittedAt: { type: Date }
  }
}, { timestamps: true });

propertySchema.index({ propertyType: 1, status: 1, isPublished: 1 });
propertySchema.index({ projectId: 1 });
propertySchema.index({ city: 1 });

const APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

module.exports = mongoose.model('Property', propertySchema);
module.exports.PROPERTY_TYPES = PROPERTY_TYPES;
module.exports.LISTING_TYPES = LISTING_TYPES;
module.exports.PROPERTY_STATUSES = PROPERTY_STATUSES;
module.exports.APPROVAL_STATUSES = APPROVAL_STATUSES;
