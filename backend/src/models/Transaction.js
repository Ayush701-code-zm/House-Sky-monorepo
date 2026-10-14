const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  plotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plot',
    required: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  buyerName: {
    type: String,
    required: true
  },
  buyerPhone: {
    type: String,
    default: ''
  },
  buyerEmail: {
    type: String,
    default: ''
  },
  sellerEmployeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: false,
    default: null
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMode: {
    type: String,
    enum: ['CHEQUE', 'NET_BANKING', 'UPI', 'CASH', 'DEMAND_DRAFT'],
    default: 'NET_BANKING'
  },
  transactionDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    default: 'COMPLETED'
  },
  receiptUrl: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
