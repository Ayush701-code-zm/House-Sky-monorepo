const mongoose = require('mongoose');

const RANKS = [
  'Advisor',
  'Team Leader',
  'Senior Team Leader',
  'Business Development Manager',
  'Sales Manager',
  'Senior Sales Manager',
  'Sales Director',
  'Core Member'
];

const employeeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeCode: {
    type: String,
    required: true,
    unique: true
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  currentRank: {
    type: String,
    enum: RANKS,
    default: 'Advisor'
  },
  selfSalesCount: {
    type: Number,
    default: 0
  },
  teamSalesCount: {
    type: Number,
    default: 0
  },
  activeLegsCount: {
    type: Number,
    default: 0
  },
  targetDeadline: {
    type: Date
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  inviteCode: {
    type: String,
    uppercase: true,
    trim: true
  },
  // legNumber: which direct-child slot under the parent (1 = first, 2 = second, etc.)
  // Replaces the old binary LEFT/RIGHT position field.
  // Unlimited legs are now supported — there is no upper bound.
  legNumber: {
    type: Number,
    default: 1,
    min: 1
  },
  yearlyTargetPlots: { type: Number, default: 0 },
  yearlyTargetAmount: { type: Number, default: 0 },
  bankName: { type: String, default: '' },
  bankAccountName: { type: String, default: '' },
  bankAccountNumber: { type: String, default: '' },
  bankIfsc: { type: String, default: '' }
}, {
  timestamps: true,
  // Expose the `id` virtual in API JSON — the admin panel keys employee rows,
  // sponsor pickers and approve/reject/delete actions off `employee.id`.
  toJSON: { virtuals: true }
});

employeeSchema.index({ inviteCode: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Employee', employeeSchema);
module.exports.RANKS = RANKS;
