const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
  goal: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Goal'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  name: {
    type: String,
    required: [true, 'Please add a task name']
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  completionDate: {
    type: Date
  },
  proofImages: {
    type: [String],
    default: []
  },
  proofSummary: {
    type: String
  },
  completionSatisfaction: {
    type: Number,
    min: 1,
    max: 5
  },
  obstacles: {
    type: String
  },
  whatNotDone: {
    type: String
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
