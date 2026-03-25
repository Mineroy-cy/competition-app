const asyncHandler = require('express-async-handler');
const Group = require('../models/Group');
const User = require('../models/User');
const Goal = require('../models/Goal');
const Task = require('../models/Task');

// Generate short invite code
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// ... [existing functions] ...
// I will rewrite the entire groupController to include the new feature.
const getGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find({ members: req.user.id })
    .populate('members', 'username profilePhoto currentStreak totalCompletedWeeks');
  res.status(200).json(groups);
});

const createGroup = asyncHandler(async (req, res) => {
  if (!req.body.name) { res.status(400); throw new Error('Please add a group name'); }
  const inviteCode = generateInviteCode();
  const group = await Group.create({
    name: req.body.name,
    description: req.body.description,
    inviteCode: inviteCode,
    creator: req.user.id,
    members: [req.user.id],
  });
  const populatedGroup = await Group.findById(group._id).populate('members', 'username profilePhoto currentStreak totalCompletedWeeks');
  res.status(200).json(populatedGroup);
});

const joinGroup = asyncHandler(async (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) { res.status(400); throw new Error('Please provide an invite code'); }
  const group = await Group.findOne({ inviteCode: inviteCode.toUpperCase() });
  if (!group) { res.status(404); throw new Error('Group not found with that invite code'); }
  if (group.members.includes(req.user.id)) { res.status(400); throw new Error('You are already a member of this group'); }
  
  group.members.push(req.user.id);
  await group.save();
  const populatedGroup = await Group.findById(group._id).populate('members', 'username profilePhoto currentStreak totalCompletedWeeks');
  res.status(200).json(populatedGroup);
});

const getGroupDetails = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id)
    .populate('members', 'username profilePhoto currentStreak totalCompletedWeeks');
  if (!group) { res.status(404); throw new Error('Group not found'); }
  const isMember = group.members.some(member => member._id.toString() === req.user.id);
  if (!isMember) { res.status(401); throw new Error('Not authorized to view this group'); }

  let sortedMembers = [...group.members].sort((a, b) => {
    if (b.totalCompletedWeeks !== a.totalCompletedWeeks) {
      return b.totalCompletedWeeks - a.totalCompletedWeeks;
    }
    return b.currentStreak - a.currentStreak;
  });

  res.status(200).json({
    group: {
      _id: group._id,
      name: group.name,
      description: group.description,
      inviteCode: group.inviteCode,
      creator: group.creator
    },
    leaderboard: sortedMembers
  });
});

// NEW FEATURE: get member detailed stats for Group Dashboard Member Detail View
const getGroupMemberStats = asyncHandler(async (req, res) => {
  const { id: groupId, memberId } = req.params;
  
  // Verify requester is in group
  const group = await Group.findById(groupId);
  if (!group || !group.members.includes(req.user.id)) {
    res.status(401); throw new Error('Not authorized');
  }

  // Verify requested member is in group
  if (!group.members.includes(memberId)) {
    res.status(404); throw new Error('Member not in group');
  }

  const userObj = await User.findById(memberId).select('-password');
  const goals = await Goal.find({ user: memberId, isArchived: false });
  const tasks = await Task.find({ user: memberId, isArchived: false });

  // Calculate stats formatting just like in dashboard
  const goalsWithStats = goals.map(g => {
    const gTasks = tasks.filter(t => t.goal.toString() === g._id.toString());
    const gCompleted = gTasks.filter(t => t.status === 'completed').length;
    return {
      _id: g._id,
      name: g.name,
      taskCount: gTasks.length,
      completedTaskCount: gCompleted,
      progress: gTasks.length === 0 ? 0 : Math.round((gCompleted / gTasks.length) * 100),
      tasks: gTasks
    };
  });

  res.status(200).json({
    user: userObj,
    goals: goalsWithStats
  });
});

module.exports = {
  getGroups,
  createGroup,
  joinGroup,
  getGroupDetails,
  getGroupMemberStats
};
