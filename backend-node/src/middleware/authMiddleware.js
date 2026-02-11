const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            // Note: Python backend stores user_id in token, but we need to fetch the user
            // to ensure they still exist.
            // Python's decode_access_token returns payload directly.
            // Python's get_current_user searches by "id": user_id
            req.user = await User.findOne({ id: decoded.user_id }).select('-password_hash');

            if (!req.user) {
                return res.status(401).json({ detail: 'User not found' });
            }

            next();
        } catch (error) {
            console.error(error);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ detail: 'Token has expired' });
            }
            return res.status(401).json({ detail: 'Could not validate credentials' });
        }
    }

    if (!token) {
        return res.status(401).json({ detail: 'Not authenticated' });
    }
};

module.exports = { protect };
