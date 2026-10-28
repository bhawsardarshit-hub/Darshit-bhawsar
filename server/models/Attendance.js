
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Half Day'],
    default: 'Present',
    required: true
  },
  checkIn: {
    type: String,
    default: ''
  },
  checkOut: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

attendanceSchema.index(
  { employee: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);

