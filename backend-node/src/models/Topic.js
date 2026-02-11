const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const quizQuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correct_answer: { type: String, required: true }
}, { _id: false });

const topicSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true,
        index: true
    },
    user_id: {
        type: String,
        required: true,
        index: true,
        ref: 'User' // Logical reference, though we use manual string IDs
    },
    topic: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        required: true,
        enum: ['beginner', 'intermediate', 'advanced']
    },
    explanation: {
        type: String,
        required: true
    },
    quiz: [quizQuestionSchema],
    score: {
        type: Number,
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false,
    versionKey: false
});

// Hide _id in JSON responses
topicSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret._id;
        return ret;
    }
});

module.exports = mongoose.model('Topic', topicSchema);
