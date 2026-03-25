const mongoose = require('mongoose');

const groupSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a group name']
  },
  description: {
    type: String
  },
  inviteCode: {
    type: String,
    unique: true
  },
  maxMembers: {
    type: Number,
    default: 50
  },
  isPrivate: {
    type: Boolean,
    default: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Group', groupSchema);
