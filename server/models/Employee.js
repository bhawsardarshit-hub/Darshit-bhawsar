
const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  department: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Employee', employeeSchema);
