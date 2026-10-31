const mongoose = require('mongoose');

const commissionPlanSchema = new mongoose.Schema({
  rankName: {
    type: String,
    required: true,
    unique: true
  },
  minSelfSales: {
    type: Number,
    required: true
  },
  minTeamSales: {
    type: Number,
    required: true
  },
  minLegs: {
    type: Number,
    required: true
  },
  timeLimitDays: {
    type: Number,
    default: 0 // 90 days for Senior Sales Manager, 100 days for Sales Director
  },
  commissionPercent: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('CommissionPlan', commissionPlanSchema);
