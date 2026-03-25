const mongoose = require('mongoose');

const goalSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  name: {
    type: String,
    required: [true, 'Please add a goal name']
  },
  description: {
    type: String
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  weekStart: {
    type: Date,
    default: () => {
      const d = new Date();
      d.setHours(0,0,0,0);
      d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1)); // Set to Monday
      return d;
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Goal', goalSchema);
