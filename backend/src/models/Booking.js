const mongoose = require('mongoose');

const BOOKING_STATUSES = ['PENDING_VERIFICATION', 'CONFIRMED', 'REJECTED', 'CANCEL_REQUESTED', 'CANCELLED'];
const LOCKING_STATUSES = ['PENDING_VERIFICATION', 'CONFIRMED', 'CANCEL_REQUESTED'];

const bookingSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  plotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plot', required: true },
  agentEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  status: { type: String, enum: BOOKING_STATUSES, default: 'PENDING_VERIFICATION' },
  floorNo: { type: String, default: '' },
  plotType: { type: String, default: '' },
  superBuiltUpSqft: { type: Number, default: 0 },
  buildUpArea: { type: Number, default: 0 },
  dimensions: { type: String, default: '' },
  bookingAmount: { type: Number, default: 0 },
  depositPhotoUrl: { type: String, default: '' },
  bookingDate: { type: Date },
  gender: { type: String, default: '' },
  passportPhotoUrl: { type: String, default: '' },
  customerName: { type: String, default: '', trim: true },
  fatherOrHusbandName: { type: String, default: '' },
  presentAddress: { type: String, default: '' },
  city: { type: String, default: '' },
  pinCode: { type: String, default: '' },
  addressProofUrl: { type: String, default: '' },
  permanentAddress: { type: String, default: '' },
  dateOfBirth: { type: Date },
  age: { type: String, default: '' },
  mobile: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  education: { type: String, default: '' },
  occupation: { type: String, default: '' },
  panNumber: { type: String, default: '' },
  idNumber: { type: String, default: '' },
  idDocUrls: [{ type: String }],
  income: { type: String, default: '' },
  futurePlan: { type: String, default: '' },
  nomineeName: { type: String, default: '' },
  nomineeDob: { type: Date },
  nomineeAddress: { type: String, default: '' },
  nomineeRelation: { type: String, default: '' },
  nomineePan: { type: String, default: '' },
  nomineeAadhaar: { type: String, default: '' },
  termsAccepted: { type: Boolean, default: false },
  extraDocs: [{
    title: { type: String, default: '' },
    url: { type: String, default: '' }
  }],
  payments: [{
    amount: { type: Number, default: 0 },
    note: { type: String, default: '' },
    receiptUrl: { type: String, default: '' },
    paidAt: { type: Date, default: Date.now }
  }],
  rejectionReason: { type: String, default: '' },
  cancelReason: { type: String, default: '' }
}, { timestamps: true });

bookingSchema.index(
  { plotId: 1 },
  { unique: true, partialFilterExpression: { status: { $in: LOCKING_STATUSES } } }
);
bookingSchema.index({ agentEmployeeId: 1, createdAt: -1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ customerName: 1 });
bookingSchema.index({ mobile: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
module.exports.BOOKING_STATUSES = BOOKING_STATUSES;
module.exports.LOCKING_STATUSES = LOCKING_STATUSES;
