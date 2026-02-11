const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Topic = require('../models/Topic');

// Generate JWT
const generateToken = (id, email) => {
    return jwt.sign({ user_id: id, email }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRATION_HOURS ? `${process.env.JWT_EXPIRATION_HOURS}h` : '24h',
        algorithm: process.env.JWT_ALGORITHM || 'HS256'
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ detail: 'Please add all fields' });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ detail: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            email,
            password_hash: hashedPassword
        });

        if (user) {
            const accessToken = generateToken(user.id, user.email);

            res.status(200).json({
                access_token: accessToken,
                token_type: 'bearer',
                user: {
                    id: user.id,
                    email: user.email,
                    created_at: user.created_at
                }
            });
        } else {
            res.status(400).json({ detail: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Server Error' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password_hash))) {
            const accessToken = generateToken(user.id, user.email);

            res.json({
                access_token: accessToken,
                token_type: 'bearer',
                user: {
                    id: user.id,
                    email: user.email,
                    created_at: user.created_at
                }
            });
        } else {
            res.status(401).json({ detail: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Server Error' });
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    res.status(200).json({
        id: req.user.id,
        email: req.user.email,
        created_at: req.user.created_at
    });
};

// @desc    Delete account
// @route   DELETE /api/auth/delete-account
// @access  Private
const deleteAccount = async (req, res) => {
    try {
        // Delete all user's topics
        await Topic.deleteMany({ user_id: req.user.id });

        // Delete user
        await User.deleteOne({ id: req.user.id });

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: 'Server Error' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    deleteAccount
};
