const mongoose = require('mongoose');

const KYC_STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'];
const DEFAULT_STATUS = 'DRAFT';

const agentKycSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    unique: true
  },
  firstName: { type: String, trim: true, default: '' },
  middleName: { type: String, trim: true, default: '' },
  surname: { type: String, trim: true, default: '' },
  dateOfBirth: { type: Date },
  address: { type: String, trim: true, default: '' },
  mobile: { type: String, trim: true, default: '' },
  alternatePhone: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, lowercase: true, default: '' },
  panNumber: { type: String, trim: true, uppercase: true, default: '' },
  aadhaarNumber: { type: String, trim: true, default: '' },
  accountHolderName: { type: String, trim: true, default: '' },
  accountNumber: { type: String, trim: true, default: '' },
  ifscCode: { type: String, trim: true, uppercase: true, default: '' },
  bankName: { type: String, trim: true, default: '' },
  branchName: { type: String, trim: true, default: '' },
  nomineeName: { type: String, trim: true, default: '' },
  nomineeDob: { type: Date },
  nomineeAddress: { type: String, trim: true, default: '' },
  nomineeRelation: { type: String, trim: true, default: '' },
  panDocUrl: { type: String, default: '' },
  panDocS3Key: { type: String, default: '' },
  aadhaarDocUrl: { type: String, default: '' },
  aadhaarDocS3Key: { type: String, default: '' },
  status: {
    type: String,
    enum: KYC_STATUSES,
    default: DEFAULT_STATUS
  },
  rejectionReason: { type: String, trim: true, default: '' },
  submittedAt: { type: Date },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: { type: Date }
}, { timestamps: true });

agentKycSchema.index({ status: 1, submittedAt: -1 });

module.exports = mongoose.model('AgentKyc', agentKycSchema);
module.exports.KYC_STATUSES = KYC_STATUSES;
module.exports.DEFAULT_STATUS = DEFAULT_STATUS;
