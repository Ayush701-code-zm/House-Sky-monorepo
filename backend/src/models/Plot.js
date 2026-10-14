const mongoose = require('mongoose');
const { computePricing } = require('../services/pricingEngine');

const plotSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  block: {
    type: String,
    required: true
  },
  plotNo: {
    type: String,
    required: true
  },
  sizeSqft: {
    type: Number,
    required: true
  },
  sellableSqYrd: {
    type: Number,
    default: 0
  },
  carpetSqYrd: {
    type: Number,
    default: 0
  },
  plc12mtr: {
    type: Number,
    default: 0
  },
  plc9mtr: {
    type: Number,
    default: 0
  },
  plcCorner: {
    type: Number,
    default: 0
  },
  plcParkFacing: {
    type: Number,
    default: 0
  },
  totalPlc: {
    type: Number,
    default: 0
  },
  discountedPlc: {
    type: Number,
    default: 0
  },
  otmc: {
    type: Number,
    default: 0
  },
  gstOnOtherCharges: {
    type: Number,
    default: 0
  },
  baseRatePerSqYrd: {
    type: Number,
    default: 0
  },
  gstRate: {
    type: Number,
    default: 18
  },
  totalCost: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'BOOKED', 'PENDING', 'SOLD'],
    default: 'AVAILABLE'
  },
  approvalStatus: {
    type: String,
    enum: ['APPROVED', 'PENDING_APPROVAL', 'REJECTED'],
    default: 'APPROVED'
  },
  requestedByRole: {
    type: String,
    default: ''
  },
  plotType: {
    type: String,
    default: 'SIMPLE'
  },
  facing: {
    type: String,
    default: ''
  },
  dimensions: {
    type: String,
    default: ''
  },
  superBuiltUpSqft: {
    type: Number,
    default: 0
  },
  marker: {
    xPercent: { type: Number, default: null },
    yPercent: { type: Number, default: null }
  },
  coordinates: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 100 },
    height: { type: Number, default: 80 }
  },
  polygon: {
    points: [{ x: Number, y: Number }],
    svgPath: { type: String, default: '' }
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  ownerName: {
    type: String,
    default: ''
  },
  ownerPhone: {
    type: String,
    default: ''
  },
  ownerEmail: {
    type: String,
    default: ''
  },
  bookingDate: {
    type: Date
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  dueBalance: {
    type: Number,
    default: 0
  },
  registryDate: {
    type: Date
  },
  registryStatus: {
    type: String,
    enum: ['NOT_REGISTERED', 'PENDING', 'REGISTERED'],
    default: 'NOT_REGISTERED'
  },
  paymentMilestones: [{
    title: { type: String, default: 'Installment' },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['PENDING', 'RECEIVED', 'OVERDUE'], default: 'PENDING' },
    paymentMode: { type: String, default: 'NET_BANKING' },
    receivedDate: { type: Date },
    notes: { type: String, default: '' }
  }]
}, { timestamps: true });

plotSchema.index({ projectId: 1, block: 1, plotNo: 1 }, { unique: true });

plotSchema.pre('save', function (next) {
  if (this.sellableSqYrd && this.sellableSqYrd > 0) {
    const p = computePricing(this);
    this.totalPlc = p.totalPlc;
    this.gstOnOtherCharges = p.gstOnOtherCharges;
    if (this.baseRatePerSqYrd && this.baseRatePerSqYrd > 0) {
      this.totalCost = p.totalCost;
      this.price = p.totalCost;
    }
  }
  next();
});

module.exports = mongoose.model('Plot', plotSchema);
