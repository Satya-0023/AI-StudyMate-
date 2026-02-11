const express = require('express');
const router = express.Router();
const {
    generateTopic,
    submitQuiz,
    getHistory,
    getTopic
} = require('../controllers/topicController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', protect, generateTopic);
router.post('/submit-quiz', protect, submitQuiz);
router.get('/history', protect, getHistory);
router.get('/:topic_id', protect, getTopic);

module.exports = router;
