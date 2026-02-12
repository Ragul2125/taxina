const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const User = require('../../models/User');
const logger = require('../../utils/logger');

/**
 * WebSocket authentication middleware
 */
const socketAuth = async (socket, next) => {
    try {
        // Get token from handshake auth
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret);

        // Find user
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return next(new Error('Authentication error: User not found'));
        }

        // Attach user to socket
        socket.user = user;
        socket.userId = user._id;
        socket.userRole = user.role;

        logger.debug(`Socket authenticated for user ${user._id} (${user.role})`);
        next();
    } catch (error) {
        logger.error('Socket authentication error:', error);

        if (error.name === 'JsonWebTokenError') {
            return next(new Error('Authentication error: Invalid token'));
        }

        if (error.name === 'TokenExpiredError') {
            return next(new Error('Authentication error: Token expired'));
        }

        next(new Error('Authentication error'));
    }
};

module.exports = socketAuth;
