
const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    trainer: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      required: true
    },
    duration: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      default: 'General'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Training', trainingSchema);
