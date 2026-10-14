const mongoose = require('mongoose');

const employeeHierarchySchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    unique: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  ancestors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }],
  path: {
    type: String, // e.g. "CEO_ID/ANKIT_ID/RAHUL_ID"
    required: true
  },
  depth: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('EmployeeHierarchy', employeeHierarchySchema);
