const { v4: uuidv4 } = require('uuid');
const Topic = require('../models/Topic');
const { generateAIContent } = require('../utils/aiService');

// @desc    Generate a new topic with AI
// @route   POST /api/topics/generate
// @access  Private
const generateTopic = async (req, res) => {
    try {
        const { topic, difficulty } = req.body;

        if (!topic || !difficulty) {
            return res.status(400).json({ detail: 'Please provide topic and difficulty' });
        }

        if (!['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
            return res.status(400).json({ detail: "Difficulty must be 'beginner', 'intermediate', or 'advanced'" });
        }

        try {
            const aiContent = await generateAIContent(topic, difficulty);

            const newTopic = await Topic.create({
                id: uuidv4(),
                user_id: req.user.id,
                topic,
                difficulty,
                explanation: aiContent.explanation,
                quiz: aiContent.quiz
            });

            // Transform response to match Pydantic model
            const responseData = {
                id: newTopic.id,
                user_id: newTopic.user_id,
                topic: newTopic.topic,
                difficulty: newTopic.difficulty,
                explanation: newTopic.explanation,
                quiz: newTopic.quiz,
                score: newTopic.score,
                created_at: newTopic.created_at.toISOString() // Python returns ISO format
            };

            res.status(200).json(responseData);

        } catch (aiError) {
            console.error('AI Generation Error:', aiError);
            return res.status(500).json({ detail: `Failed to generate content: ${aiError.message}` });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Server Error' });
    }
};

// @desc    Submit quiz answers
// @route   POST /api/topics/submit-quiz
// @access  Private
const submitQuiz = async (req, res) => {
    try {
        const { topic_id, answers } = req.body;

        const topic = await Topic.findOne({ id: topic_id, user_id: req.user.id });

        if (!topic) {
            return res.status(404).json({ detail: 'Topic not found' });
        }

        const quiz = topic.quiz;
        if (answers.length !== quiz.length) {
            return res.status(400).json({ detail: 'Number of answers must match number of questions' });
        }

        let correctCount = 0;
        quiz.forEach((q, i) => {
            if (answers[i] === q.correct_answer) {
                correctCount++;
            }
        });

        const total = quiz.length;
        const percentage = (correctCount / total) * 100;
        const passed = percentage >= 60;

        // Update topic with score
        topic.score = correctCount;
        await topic.save();

        res.status(200).json({
            score: correctCount,
            total,
            percentage,
            passed
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Server Error' });
    }
};

// @desc    Get topic history
// @route   GET /api/topics/history
// @access  Private
const getHistory = async (req, res) => {
    try {
        const topics = await Topic.find({ user_id: req.user.id })
            .sort({ created_at: -1 })
            .limit(100);

        const responseData = topics.map(topic => ({
            id: topic.id,
            user_id: topic.user_id,
            topic: topic.topic,
            difficulty: topic.difficulty,
            explanation: topic.explanation,
            quiz: topic.quiz,
            score: topic.score,
            created_at: topic.created_at.toISOString()
        }));

        res.status(200).json(responseData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Server Error' });
    }
};

// @desc    Get single topic
// @route   GET /api/topics/:topic_id
// @access  Private
const getTopic = async (req, res) => {
    try {
        const topic = await Topic.findOne({ id: req.params.topic_id, user_id: req.user.id });

        if (!topic) {
            return res.status(404).json({ detail: 'Topic not found' });
        }

        res.status(200).json({
            id: topic.id,
            user_id: topic.user_id,
            topic: topic.topic,
            difficulty: topic.difficulty,
            explanation: topic.explanation,
            quiz: topic.quiz,
            score: topic.score,
            created_at: topic.created_at.toISOString()
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Server Error' });
    }
};

module.exports = {
    generateTopic,
    submitQuiz,
    getHistory,
    getTopic
};
