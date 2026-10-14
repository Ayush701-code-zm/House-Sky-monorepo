const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'AGENT', 'DIRECTOR']
  },
  permissions: [{ type: String }],
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
