const asyncHandler = require('express-async-handler');
const { archiveCurrentWeekForUser } = require('../services/archiveHelper');
const WeeklyRecord = require('../models/WeeklyRecord');
const { Parser } = require('json2csv');

// @desc    Manually Complete and Archive Current Week
// @route   POST /api/weeks/complete
// @access  Private
const completeWeek = asyncHandler(async (req, res) => {
  const record = await archiveCurrentWeekForUser(req.user.id);
  if (!record) {
    res.status(400);
    throw new Error('No active goals or tasks to complete');
  }
  res.status(200).json(record);
});

// @desc    Get all history weeks
// @route   GET /api/weeks
// @access  Private
const getHistory = asyncHandler(async (req, res) => {
  const records = await WeeklyRecord.find({ user: req.user.id, isSoftDeleted: false })
    .sort({ createdAt: -1 });
  res.status(200).json(records);
});

// @desc    Soft Delete week
// @route   DELETE /api/weeks/:id
// @access  Private
const deleteHistoryWeek = asyncHandler(async (req, res) => {
  const record = await WeeklyRecord.findById(req.params.id);

  if (!record) {
    res.status(400);
    throw new Error('Record not found');
  }

  if (record.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('User not authorized');
  }

  record.isSoftDeleted = true;
  await record.save();

  res.status(200).json({ id: req.params.id });
});

// @desc    Download CSV for week
// @route   GET /api/weeks/:id/download
// @access  Private
const downloadWeekCSV = asyncHandler(async (req, res) => {
  const record = await WeeklyRecord.findById(req.params.id);

  if (!record || record.user.toString() !== req.user.id) {
    res.status(400);
    throw new Error('Record not found or unauthorized');
  }

  const snapshot = record.snapshot || [];
  let data = [];

  snapshot.forEach(goal => {
    if (goal.tasks && goal.tasks.length > 0) {
      goal.tasks.forEach(task => {
        data.push({
          WeekNumber: record.weekNumber,
          StartDate: record.startDate,
          EndDate: record.endDate,
          GoalName: goal.name,
          TaskName: task.name,
          Status: task.status,
          CompletionDate: task.completionDate ? task.completionDate : 'N/A'
        });
      });
    } else {
      data.push({
        WeekNumber: record.weekNumber,
        StartDate: record.startDate,
        EndDate: record.endDate,
        GoalName: goal.name,
        TaskName: 'N/A',
        Status: 'N/A',
        CompletionDate: 'N/A'
      });
    }
  });

  const json2csvParser = new Parser();
  const csv = json2csvParser.parse(data);

  res.header('Content-Type', 'text/csv');
  res.attachment(`Week_${record.weekNumber}_Report.csv`);
  return res.send(csv);
});

const getWeeklyInsightsForUser = asyncHandler(async (req, res) => {
  const { getWeeklyInsights } = require('../utils/aiService');
  
  // Find the most recently completed week
  const record = await WeeklyRecord.findOne({ user: req.user.id, isSoftDeleted: false })
    .sort({ createdAt: -1 });

  if (!record) {
    return res.status(200).json({ insight: "No completed weeks found to generate insights." });
  }

  // Extract tasks with obstacles or whatNotDone
  let pastTasks = [];
  if (record.snapshot) {
    record.snapshot.forEach(goal => {
      if (goal.tasks) {
         goal.tasks.forEach(task => {
           if ((task.obstacles && task.obstacles.trim() !== '') || 
               (task.whatNotDone && task.whatNotDone.trim() !== '')) {
             pastTasks.push(task);
           }
         });
      }
    });
  }

  if (pastTasks.length === 0) {
    return res.status(200).json({ insight: "You had a smooth week with no reported obstacles or missed tasks! Keep up the great work." });
  }

  const insight = await getWeeklyInsights(pastTasks);
  res.status(200).json({ insight });
});

module.exports = {
  completeWeek,
  getHistory,
  deleteHistoryWeek,
  downloadWeekCSV,
  getWeeklyInsightsForUser
};
