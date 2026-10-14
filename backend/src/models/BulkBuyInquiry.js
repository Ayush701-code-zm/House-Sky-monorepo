const mongoose = require('mongoose');

const MIN_BULK_UNITS = 2;
const MAX_BULK_UNITS = 500;
const BULK_BUY_STATUSES = ['NEW', 'IN_PROGRESS', 'CONTACTED', 'CONVERTED', 'REJECTED'];
const DEFAULT_STATUS = 'NEW';
const DEFAULT_SOURCE = 'PROPERTIES_PAGE';

const bulkBuyInquirySchema = new mongoose.Schema({
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
  unitCount: {
    type: Number,
    required: true,
    min: MIN_BULK_UNITS,
    max: MAX_BULK_UNITS
  },
  budgetRange: {
    type: String,
    default: ''
  },
  propertyType: {
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
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    default: null
  },
  propertyTitle: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: BULK_BUY_STATUSES,
    default: DEFAULT_STATUS
  },
  assignedAgentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  source: {
    type: String,
    default: DEFAULT_SOURCE
  }
}, { timestamps: true });

module.exports = mongoose.model('BulkBuyInquiry', bulkBuyInquirySchema);
module.exports.MIN_BULK_UNITS = MIN_BULK_UNITS;
module.exports.MAX_BULK_UNITS = MAX_BULK_UNITS;
module.exports.BULK_BUY_STATUSES = BULK_BUY_STATUSES;
