const mongoose = require('mongoose');

const plotDocumentSchema = new mongoose.Schema({
  plotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plot',
    required: true
  },
  documentType: {
    type: String,
    enum: ['REGISTRY', 'PAYMENT_RECEIPT', 'NOC', 'MAP_LAYOUT', 'AGREEMENT', 'OTHER'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('PlotDocument', plotDocumentSchema);
