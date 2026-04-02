const mongoose = require('mongoose');

const streakFreezeVoteSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  vote: {
    type: String,
    enum: ['yes', 'no'],
    required: true,
  },
}, { _id: false });

const streakFreezeSchema = mongoose.Schema({
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  votes: {
    type: [streakFreezeVoteSchema],
    default: [],
  },
}, { _id: true });

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
  inviteCodeAccessUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  streakFreezes: {
    type: [streakFreezeSchema],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Group', groupSchema);
