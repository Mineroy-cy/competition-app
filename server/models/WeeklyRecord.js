const mongoose = require('mongoose');

const weeklyRecordSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  weekNumber: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalGoals: {
    type: Number,
    default: 0
  },
  completedGoals: {
    type: Number,
    default: 0
  },
  totalTasks: {
    type: Number,
    default: 0
  },
  completedTasks: {
    type: Number,
    default: 0
  },
  snapshot: {
    type: mongoose.Schema.Types.Mixed, // Stores the frozen state of goals and tasks
    default: {}
  },
  isSoftDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WeeklyRecord', weeklyRecordSchema);
