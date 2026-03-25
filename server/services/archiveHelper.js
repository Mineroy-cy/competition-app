const Goal = require('../models/Goal');
const Task = require('../models/Task');
const WeeklyRecord = require('../models/WeeklyRecord');
const User = require('../models/User');

const getStartOfWeek = () => {
  const d = new Date();
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
  return d;
};

// Extracted archive logic so it can be used by both manual button and cron job
const archiveCurrentWeekForUser = async (userId) => {
  // 1. Fetch current active goals & tasks
  const goals = await Goal.find({ user: userId, isArchived: false });
  const tasks = await Task.find({ user: userId, isArchived: false });

  if (goals.length === 0 && tasks.length === 0) {
    return null; // Nothing to archive
  }

  // Calculate Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  
  const totalGoals = goals.length;
  let completedGoals = 0;
  
  let fullyCompletedGoals = true;

  const goalsSnapshot = goals.map(g => {
    const gTasks = tasks.filter(t => t.goal.toString() === g._id.toString());
    const gCompleted = gTasks.filter(t => t.status === 'completed').length;
    
    if (gTasks.length > 0 && gTasks.length === gCompleted) {
      completedGoals++;
    } else if (gTasks.length > 0) {
      fullyCompletedGoals = false;
    }

    return {
      _id: g._id,
      name: g.name,
      tasks: gTasks.map(t => ({
        _id: t._id,
        name: t.name,
        status: t.status,
        completionDate: t.completionDate,
        proofImages: t.proofImages
      }))
    };
  });

  // Calculate Streak Logic (Very rough heuristic based on whether all active goals had task completion)
  // For precise daily streak, we would check daily progress, but we simplify the streak increment
  // to: If they completed all goals this week, increment streak by 1 week, otherwise 0.
  const userObj = await User.findById(userId);
  let newStreak = fullyCompletedGoals && totalGoals > 0 ? userObj.currentStreak + 1 : 0;
  
  await User.findByIdAndUpdate(userId, {
    currentStreak: newStreak,
    $inc: { totalCompletedWeeks: fullyCompletedGoals && totalGoals > 0 ? 1 : 0 }
  });

  // Create Weekly Record
  const d = new Date();
  const startOfWeek = getStartOfWeek();
  // if startOfWeek is same as today, it probably just started. We use weekStart from earliest goal
  let actualStart = startOfWeek;
  if (goals.length > 0 && goals[0].weekStart) {
    actualStart = goals[0].weekStart;
  }

  // Get sequential week number
  const lastRecord = await WeeklyRecord.findOne({ user: userId }).sort({ weekNumber: -1 });
  const nextWeekNumber = lastRecord && lastRecord.weekNumber ? lastRecord.weekNumber + 1 : 1;

  const record = await WeeklyRecord.create({
    user: userId,
    weekNumber: nextWeekNumber,
    startDate: actualStart,
    endDate: d,
    totalGoals,
    completedGoals,
    totalTasks,
    completedTasks,
    snapshot: goalsSnapshot
  });

  // Archive everything
  await Goal.updateMany({ user: userId, isArchived: false }, { isArchived: true });
  await Task.updateMany({ user: userId, isArchived: false }, { isArchived: true });

  return record;
};

module.exports = { archiveCurrentWeekForUser };
