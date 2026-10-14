const mongoose = require('mongoose');

const GALLERY_CATEGORIES = [
  'PROJECT_SHOWCASE',
  'SITE_VISITS',
  'EVENTS_CONFERENCES',
  'MODEL_TOWNSHIPS',
  'CUSTOMER_DELIVERIES',
  'GENERAL'
];

const galleryItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: GALLERY_CATEGORIES,
    default: 'PROJECT_SHOWCASE'
  },
  imageUrl: {
    type: String,
    required: true
  },
  imageS3Key: {
    type: String,
    default: ''
  },
  caption: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

galleryItemSchema.index({ isPublished: 1, order: 1, createdAt: -1 });

module.exports = mongoose.model('GalleryItem', galleryItemSchema);
module.exports.GALLERY_CATEGORIES = GALLERY_CATEGORIES;
