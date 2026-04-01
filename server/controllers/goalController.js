const asyncHandler = require('express-async-handler');
const Goal = require('../models/Goal');
const Task = require('../models/Task');

// @desc    Get dashboard stats and goals
// @route   GET /api/goals
// @access  Private
const getGoals = asyncHandler(async (req, res) => {
  const goals = await Goal.find({ user: req.user.id, isArchived: false });
  // Calculate dashboard stats:
  // Weekly completion, Tasks completed out of total
  const tasks = await Task.find({ user: req.user.id, isArchived: false });
  
  let totalTasks = tasks.length;
  let completedTasks = tasks.filter(t => t.status === 'completed').length;
  let taskProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  let totalGoals = goals.length;
  let completedGoalsCount = 0;

  // Enhance goals with task details for the cards
  const goalsWithStats = goals.map(goal => {
    const goalTasks = tasks.filter(t => t.goal.toString() === goal._id.toString());
    const gTotal = goalTasks.length;
    const gCompleted = goalTasks.filter(t => t.status === 'completed').length;
    if (gTotal > 0 && gTotal === gCompleted) {
      completedGoalsCount++;
    }
    const gProgress = gTotal === 0 ? 0 : Math.round((gCompleted / gTotal) * 100);
    return {
      ...goal.toObject(),
      taskCount: gTotal,
      completedTaskCount: gCompleted,
      progress: gProgress,
      tasks: goalTasks 
    };
  });

  let goalProgress = totalGoals === 0 ? 0 : Math.round((completedGoalsCount / totalGoals) * 100);

  res.status(200).json({
    stats: {
      totalGoals,
      completedGoals: completedGoalsCount,
      totalTasks,
      completedTasks,
      taskProgress,
      goalProgress
    },
    goals: goalsWithStats,
  });
});

// @desc    Set goal
// @route   POST /api/goals
// @access  Private
const setGoal = asyncHandler(async (req, res) => {
  const body = req.body || {};

  if (Object.keys(body).length === 0) {
    res.status(400);
    throw new Error('Request body is missing. Ensure Content-Type is application/json and JSON payload is sent.');
  }

  if (!body.name || !String(body.name).trim()) {
    res.status(400);
    throw new Error('Please add a goal name');
  }

  const goal = await Goal.create({
    name: String(body.name).trim(),
    description: body.description,
    user: req.user.id,
  });

  const fullGoal = {
    ...goal.toObject(),
    taskCount: 0,
    completedTaskCount: 0,
    progress: 0,
    tasks: []
  };

  res.status(200).json(fullGoal);
});

// @desc    Update goal
// @route   PUT /api/goals/:id
// @access  Private
const updateGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findById(req.params.id);

  if (!goal) {
    res.status(400);
    throw new Error('Goal not found');
  }

  // Check for user
  if (!req.user) {
    res.status(401);
    throw new Error('User not found');
  }

  // Make sure the logged in user matches the goal user
  if (goal.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized');
  }

  const updatedGoal = await Goal.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.status(200).json(updatedGoal);
});

// @desc    Delete goal
// @route   DELETE /api/goals/:id
// @access  Private
const deleteGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findById(req.params.id);

  if (!goal) {
    res.status(400);
    throw new Error('Goal not found');
  }

  // Check for user
  if (!req.user) {
    res.status(401);
    throw new Error('User not found');
  }

  // Make sure the logged in user matches the goal user
  if (goal.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized');
  }

  await goal.deleteOne();
  
  // also delete tasks associated
  await Task.deleteMany({ goal: req.params.id });

  res.status(200).json({ id: req.params.id });
});

module.exports = {
  getGoals,
  setGoal,
  updateGoal,
  deleteGoal,
};
