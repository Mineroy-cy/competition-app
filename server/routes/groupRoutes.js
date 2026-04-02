const express = require('express');
const router = express.Router();
const {
  getGroups,
  createGroup,
  joinGroup,
  getGroupDetails,
  getGroupMemberStats,
  updateInviteCodeAccess,
  removeGroupMember,
  requestStreakFreeze,
  voteStreakFreeze
} = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getGroups);
router.post('/', protect, createGroup);
router.post('/join', protect, joinGroup);
router.put('/:id/invite-code-access', protect, updateInviteCodeAccess);
router.delete('/:id/members/:memberId', protect, removeGroupMember);
router.post('/:id/streak-freeze/request', protect, requestStreakFreeze);
router.post('/:id/streak-freeze/:freezeId/vote', protect, voteStreakFreeze);
router.get('/:id', protect, getGroupDetails);
router.get('/:id/members/:memberId', protect, getGroupMemberStats);

module.exports = router;
