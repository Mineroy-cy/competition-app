const asyncHandler = require('express-async-handler');
const Group = require('../models/Group');
const User = require('../models/User');
const Goal = require('../models/Goal');
const Task = require('../models/Task');
const { normalizeDailyStreak } = require('../services/dailyStreakService');

const FREEZE_EXPIRY_MS = 24 * 60 * 60 * 1000;

// Generate short invite code
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const getFreezeRequestedAt = (freeze) => {
  if (freeze.requestedAt) return new Date(freeze.requestedAt);
  if (freeze.createdAt) return new Date(freeze.createdAt);
  return new Date(freeze.date);
};

const cleanupExpiredFreezes = async (group) => {
  if (!group || !Array.isArray(group.streakFreezes)) return;

  const now = Date.now();
  const activeFreezes = group.streakFreezes.filter((freeze) => {
    const requestedAt = getFreezeRequestedAt(freeze).getTime();
    return now - requestedAt < FREEZE_EXPIRY_MS;
  });

  if (activeFreezes.length !== group.streakFreezes.length) {
    group.streakFreezes = activeFreezes;
    await group.save();
  }
};

// ... [existing functions] ...
// I will rewrite the entire groupController to include the new feature.
const getGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find({ members: req.user.id })
    .populate('members', 'username profilePhoto currentStreak totalCompletedWeeks');
  res.status(200).json(groups);
});

const createGroup = asyncHandler(async (req, res) => {
  const body = req.body || {};

  if (Object.keys(body).length === 0) {
    res.status(400);
    throw new Error('Request body is missing. Ensure Content-Type is application/json and JSON payload is sent.');
  }

  if (!body.name || !String(body.name).trim()) { res.status(400); throw new Error('Please add a group name'); }
  const inviteCode = generateInviteCode();
  const group = await Group.create({
    name: String(body.name).trim(),
    description: body.description,
    inviteCode: inviteCode,
    creator: req.user.id,
    members: [req.user.id],
    inviteCodeAccessUsers: [],
  });
  const populatedGroup = await Group.findById(group._id).populate('members', 'username profilePhoto currentStreak totalCompletedWeeks');
  res.status(200).json(populatedGroup);
});

const joinGroup = asyncHandler(async (req, res) => {
  const { inviteCode } = req.body || {};
  if (!inviteCode) { res.status(400); throw new Error('Please provide an invite code'); }
  const group = await Group.findOne({ inviteCode: inviteCode.toUpperCase() });
  if (!group) { res.status(404); throw new Error('Group not found with that invite code'); }
  if (group.members.some(member => member.toString() === req.user.id)) { res.status(400); throw new Error('You are already a member of this group'); }
  
  group.members.push(req.user.id);
  await group.save();
  const populatedGroup = await Group.findById(group._id).populate('members', 'username profilePhoto currentStreak totalCompletedWeeks');
  res.status(200).json(populatedGroup);
});

const getGroupDetails = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id)
    .populate('members', 'username profilePhoto currentStreak totalCompletedWeeks');
  if (!group) { res.status(404); throw new Error('Group not found'); }

  await cleanupExpiredFreezes(group);

  const isMember = group.members.some(member => member._id.toString() === req.user.id);
  if (!isMember) { res.status(401); throw new Error('Not authorized to view this group'); }
  const isCreator = group.creator.toString() === req.user.id;
  const canViewInviteCode = isCreator || (group.inviteCodeAccessUsers || []).some((memberId) => memberId.toString() === req.user.id);

  let sortedMembers = [...group.members].sort((a, b) => {
    if (b.totalCompletedWeeks !== a.totalCompletedWeeks) {
      return b.totalCompletedWeeks - a.totalCompletedWeeks;
    }
    return b.currentStreak - a.currentStreak;
  });

  const memberMap = new Map(group.members.map((m) => [m._id.toString(), m.username]));
  const streakFreezes = (group.streakFreezes || []).map((freeze) => {
    const requestedAt = getFreezeRequestedAt(freeze);
    const expiresAt = new Date(requestedAt.getTime() + FREEZE_EXPIRY_MS);
    const timeLeftMs = Math.max(0, expiresAt.getTime() - Date.now());
    const totalEligibleVoters = group.members.filter((m) => m._id.toString() !== freeze.targetUser.toString()).length;
    const yesVotes = (freeze.votes || []).filter((v) => v.vote === 'yes').length;
    const noVotes = (freeze.votes || []).filter((v) => v.vote === 'no').length;

    return {
      _id: freeze._id,
      targetUser: freeze.targetUser,
      targetUsername: memberMap.get(freeze.targetUser.toString()) || 'Unknown',
      requestedBy: freeze.requestedBy,
      requestedByUsername: memberMap.get(freeze.requestedBy.toString()) || 'Unknown',
      date: freeze.date,
      requestedAt,
      expiresAt,
      timeLeftMs,
      status: freeze.status,
      yesVotes,
      noVotes,
      totalEligibleVoters,
      votes: (freeze.votes || []).map((v) => ({
        user: v.user,
        username: memberMap.get(v.user.toString()) || 'Unknown',
        vote: v.vote,
      })),
    };
  });

  res.status(200).json({
    group: {
      _id: group._id,
      name: group.name,
      description: group.description,
      inviteCode: canViewInviteCode ? group.inviteCode : null,
      creator: group.creator,
      inviteCodeAccessUsers: group.inviteCodeAccessUsers || [],
    },
    leaderboard: sortedMembers,
    streakFreezes,
    canViewInviteCode,
    canManageGroup: isCreator,
  });
});

const updateInviteCodeAccess = asyncHandler(async (req, res) => {
  const { id: groupId } = req.params;
  const body = req.body || {};
  const requestedUserIds = Array.isArray(body.userIds) ? body.userIds.map(String) : [];

  const group = await Group.findById(groupId);
  if (!group) {
    res.status(404);
    throw new Error('Group not found');
  }

  if (group.creator.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Only the group creator can change invite code access');
  }

  const memberIds = new Set(group.members.map((memberId) => memberId.toString()));
  const allowedIds = requestedUserIds.filter((memberId) => memberId !== req.user.id && memberIds.has(memberId));

  group.inviteCodeAccessUsers = [...new Set(allowedIds)];
  await group.save();

  res.status(200).json({ inviteCodeAccessUsers: group.inviteCodeAccessUsers });
});

const removeGroupMember = asyncHandler(async (req, res) => {
  const { id: groupId, memberId } = req.params;

  const group = await Group.findById(groupId);
  if (!group) {
    res.status(404);
    throw new Error('Group not found');
  }

  if (group.creator.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Only the group creator can remove members');
  }

  if (group.creator.toString() === memberId) {
    res.status(400);
    throw new Error('The creator cannot be removed from the group');
  }

  const isMember = group.members.some((member) => member.toString() === memberId);
  if (!isMember) {
    res.status(404);
    throw new Error('Member not found in this group');
  }

  group.members = group.members.filter((member) => member.toString() !== memberId);
  group.inviteCodeAccessUsers = (group.inviteCodeAccessUsers || []).filter((allowedId) => allowedId.toString() !== memberId);
  await group.save();

  res.status(200).json({ message: 'Member removed from group' });
});

const requestStreakFreeze = asyncHandler(async (req, res) => {
  const { id: groupId } = req.params;
  const body = req.body || {};
  const targetUserId = body.targetUserId || req.user.id;

  const group = await Group.findById(groupId);
  if (!group) {
    res.status(404);
    throw new Error('Group not found');
  }

  await cleanupExpiredFreezes(group);

  const isRequesterMember = group.members.some((m) => m.toString() === req.user.id);
  const isTargetMember = group.members.some((m) => m.toString() === targetUserId);

  if (!isRequesterMember || !isTargetMember) {
    res.status(401);
    throw new Error('Not authorized for this group');
  }

  if (targetUserId !== req.user.id) {
    res.status(400);
    throw new Error('You can only request streak freeze for yourself');
  }

  const yesterday = getStartOfDay(new Date());
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayEnd = getEndOfDay(yesterday);

  const existing = (group.streakFreezes || []).find((freeze) => (
    freeze.targetUser.toString() === targetUserId &&
    freeze.date >= yesterday &&
    freeze.date <= yesterdayEnd &&
    freeze.status !== 'rejected'
  ));

  if (existing) {
    res.status(400);
    throw new Error('A pending or approved freeze already exists for yesterday');
  }

  group.streakFreezes.push({
    targetUser: targetUserId,
    date: yesterday,
    requestedBy: req.user.id,
    requestedAt: new Date(),
    votes: [],
    status: 'pending',
  });

  await group.save();
  res.status(201).json({ message: 'Streak freeze request created for yesterday' });
});

const voteStreakFreeze = asyncHandler(async (req, res) => {
  const { id: groupId, freezeId } = req.params;
  const body = req.body || {};
  const vote = String(body.vote || '').toLowerCase();

  if (!['yes', 'no'].includes(vote)) {
    res.status(400);
    throw new Error('Vote must be yes or no');
  }

  const group = await Group.findById(groupId);
  if (!group) {
    res.status(404);
    throw new Error('Group not found');
  }

  const freezeBeforeCleanup = (group.streakFreezes || []).id(freezeId);
  if (freezeBeforeCleanup) {
    const requestedAt = getFreezeRequestedAt(freezeBeforeCleanup).getTime();
    if (Date.now() - requestedAt >= FREEZE_EXPIRY_MS) {
      await cleanupExpiredFreezes(group);
      res.status(410);
      throw new Error('Freeze request expired and has been removed');
    }
  }

  await cleanupExpiredFreezes(group);

  const isMember = group.members.some((m) => m.toString() === req.user.id);
  if (!isMember) {
    res.status(401);
    throw new Error('Not authorized for this group');
  }

  const freeze = (group.streakFreezes || []).id(freezeId);
  if (!freeze) {
    res.status(404);
    throw new Error('Freeze request not found');
  }

  if (freeze.status !== 'pending') {
    res.status(400);
    throw new Error(`Freeze request is already ${freeze.status}`);
  }

  if (freeze.targetUser.toString() === req.user.id) {
    res.status(400);
    throw new Error('Target user cannot vote on their own freeze request');
  }

  const existingVote = (freeze.votes || []).find((v) => v.user.toString() === req.user.id);
  if (existingVote) {
    existingVote.vote = vote;
  } else {
    freeze.votes.push({ user: req.user.id, vote });
  }

  const eligibleVoters = group.members.filter((m) => m.toString() !== freeze.targetUser.toString());
  const yesVotes = (freeze.votes || []).filter((v) => v.vote === 'yes').length;
  const hasNoVote = (freeze.votes || []).some((v) => v.vote === 'no');

  if (hasNoVote) {
    freeze.status = 'rejected';
  } else if (yesVotes === eligibleVoters.length) {
    freeze.status = 'approved';
    await normalizeDailyStreak(freeze.targetUser);
  }

  await group.save();

  res.status(200).json({
    message: 'Vote recorded',
    status: freeze.status,
    yesVotes,
    requiredYesVotes: eligibleVoters.length,
  });
});

// NEW FEATURE: get member detailed stats for Group Dashboard Member Detail View
const getGroupMemberStats = asyncHandler(async (req, res) => {
  const { id: groupId, memberId } = req.params;
  
  // Verify requester is in group
  const group = await Group.findById(groupId);
  if (!group || !group.members.some(member => member.toString() === req.user.id)) {
    res.status(401); throw new Error('Not authorized');
  }

  // Verify requested member is in group
  if (!group.members.some(member => member.toString() === memberId)) {
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
  getGroupMemberStats,
  updateInviteCodeAccess,
  removeGroupMember,
  requestStreakFreeze,
  voteStreakFreeze
};
