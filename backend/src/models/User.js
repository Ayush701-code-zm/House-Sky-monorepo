const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'AGENT', 'DIRECTOR', 'USER', 'PROPERTY_OWNER'],
    default: 'AGENT'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  approvalStatus: {
    type: String,
    enum: ['APPROVED', 'PENDING_APPROVAL', 'REJECTED'],
    default: 'APPROVED'
  },
  avatar: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  verificationTokenExpires: {
    type: Date,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  // Bumped on every password change/reset. JWTs carry the version they were
  // issued with, so bumping it logs out every existing session.
  tokenVersion: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Never serialise secrets (password hash, verification/reset tokens) into API
// responses, even when a controller returns a full User document.
const stripSecrets = (doc, ret) => {
  delete ret.password;
  delete ret.verificationToken;
  delete ret.resetPasswordToken;
  return ret;
};
userSchema.set('toJSON', { transform: stripSecrets });
userSchema.set('toObject', { transform: stripSecrets });

module.exports = mongoose.model('User', userSchema);
