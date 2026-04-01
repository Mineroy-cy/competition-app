const Goal = require('../models/Goal');
const Task = require('../models/Task');
const User = require('../models/User');
const Group = require('../models/Group');

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

const isSameDay = (a, b) => {
  if (!a || !b) return false;
  return getStartOfDay(a).getTime() === getStartOfDay(b).getTime();
};

const hasApprovedFreezeForDate = async (userId, date) => {
  const dayStart = getStartOfDay(date);
  const dayEnd = getEndOfDay(date);

  const match = await Group.findOne({
    members: userId,
    streakFreezes: {
      $elemMatch: {
        targetUser: userId,
        status: 'approved',
        date: { $gte: dayStart, $lte: dayEnd },
      },
    },
  }).select('_id');

  return !!match;
};

const evaluateDailyGoalCoverage = async (userId, date = new Date()) => {
  const activeGoals = await Goal.find({ user: userId, isArchived: false }).select('_id');

  if (activeGoals.length === 0) {
    return false;
  }

  const goalIds = activeGoals.map((g) => g._id.toString());
  const completedTasksToday = await Task.find({
    user: userId,
    isArchived: false,
    status: 'completed',
    completionDate: {
      $gte: getStartOfDay(date),
      $lte: getEndOfDay(date),
    },
  }).select('goal');

  const completedGoalIds = new Set(completedTasksToday.map((t) => t.goal.toString()));

  return goalIds.every((id) => completedGoalIds.has(id));
};

const normalizeDailyStreak = async (userId) => {
  const user = await User.findById(userId).select('currentStreak lastStreakDate');
  if (!user) return null;

  const today = getStartOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (!user.lastStreakDate) {
    return user;
  }

  const last = getStartOfDay(user.lastStreakDate);

  if (last.getTime() < yesterday.getTime()) {
    const hasFreezeYesterday = await hasApprovedFreezeForDate(userId, yesterday);

    if (hasFreezeYesterday) {
      user.lastStreakDate = yesterday;
      await user.save();
      return user;
    }
  }

  if (last.getTime() < yesterday.getTime() && user.currentStreak !== 0) {
    user.currentStreak = 0;
    await user.save();
  }

  return user;
};

const updateDailyStreakOnTaskCompletion = async (userId, completionDate = new Date()) => {
  await normalizeDailyStreak(userId);

  const coverageMet = await evaluateDailyGoalCoverage(userId, completionDate);
  if (!coverageMet) return null;

  const user = await User.findById(userId).select('currentStreak lastStreakDate');
  if (!user) return null;

  const completionDay = getStartOfDay(completionDate);

  if (isSameDay(user.lastStreakDate, completionDay)) {
    return user;
  }

  const yesterday = new Date(completionDay);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(user.lastStreakDate, yesterday)) {
    user.currentStreak = (user.currentStreak || 0) + 1;
  } else {
    user.currentStreak = 1;
  }

  user.lastStreakDate = completionDay;
  await user.save();
  return user;
};

module.exports = {
  normalizeDailyStreak,
  updateDailyStreakOnTaskCompletion,
};
