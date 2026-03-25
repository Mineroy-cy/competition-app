const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { addTask, completeTask, deleteTask, getSuggestions } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, addTask);
router.get('/suggestions/:goalId', protect, getSuggestions);
// Allow multiple proofs up to 5 images
router.put('/:id/complete', protect, upload.array('proof', 5), completeTask);
router.delete('/:id', protect, deleteTask);

module.exports = router;
