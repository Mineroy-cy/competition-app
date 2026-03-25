const express = require('express');
const router = express.Router();
const {
  getGroups,
  createGroup,
  joinGroup,
  getGroupDetails,
  getGroupMemberStats
} = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getGroups);
router.post('/', protect, createGroup);
router.post('/join', protect, joinGroup);
router.get('/:id', protect, getGroupDetails);
router.get('/:id/members/:memberId', protect, getGroupMemberStats);

module.exports = router;
