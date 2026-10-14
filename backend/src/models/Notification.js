const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // userId is optional — null means it's a system-wide admin notification
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  // category for filtering in the admin notification feed
  category: {
    type: String,
    enum: ['SYSTEM', 'BULK_DEAL', 'INQUIRY', 'PROPERTY', 'AGENT', 'COMMISSION'],
    default: 'SYSTEM'
  },
  channel: {
    type: String,
    enum: ['IN_APP', 'EMAIL', 'WHATSAPP'],
    default: 'IN_APP'
  },
  status: {
    type: String,
    enum: ['UNREAD', 'READ', 'SENT', 'FAILED'],
    default: 'UNREAD'
  },
  // extra context (e.g. investor name, property title, inquiry type)
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
