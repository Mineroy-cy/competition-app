const express = require('express');
const router = express.Router();
const {
  completeWeek,
  getHistory,
  deleteHistoryWeek,
  downloadWeekCSV,
  getWeeklyInsightsForUser
} = require('../controllers/weekController');
const { protect } = require('../middleware/authMiddleware');

router.post('/complete', protect, completeWeek);
router.get('/insights', protect, getWeeklyInsightsForUser);
router.get('/', protect, getHistory);
router.delete('/:id', protect, deleteHistoryWeek);
router.get('/:id/download', protect, downloadWeekCSV);

module.exports = router;
