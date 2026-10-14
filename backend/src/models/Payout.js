const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  payoutDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },
  referenceNo: {
    type: String,
    required: true,
    unique: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    branchName: String,
    accountHolderName: String
  },
  // The exact commissions this payout settles — approving it marks only these
  // as PAID, keeping payout totals reconciled with commission records.
  commissionIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commission'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Payout', payoutSchema);
