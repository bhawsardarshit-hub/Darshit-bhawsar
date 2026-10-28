
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },
    category: {
      type: String,
      enum: ['General', 'Important', 'Event', 'Policy'],
      default: 'General'
    },
    author: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Announcement', announcementSchema);
