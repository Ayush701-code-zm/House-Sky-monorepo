const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  plotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plot',
    required: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  rankAtSale: {
    type: String,
    required: true
  },
  saleAmount: {
    type: Number,
    required: true
  },
  commissionRate: {
    type: Number,
    required: true
  },
  differentialRate: {
    type: Number,
    required: true
  },
  commissionAmount: {
    type: Number,
    required: true
  },
  levelDepth: {
    type: Number,
    default: 0 // 0 for direct seller, 1+ for sponsor downlines
  },
  status: {
    type: String,
    enum: ['CALCULATED', 'APPROVED', 'PAID', 'CANCELLED'],
    default: 'CALCULATED'
  },
  calculatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// One commission row per (transaction, employee) — hard DB guard against
// double-payment even if the engine is somehow triggered twice concurrently.
commissionSchema.index({ transactionId: 1, employeeId: 1 }, { unique: true });

module.exports = mongoose.model('Commission', commissionSchema);
