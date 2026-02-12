const logger = require('../utils/logger');

/**
 * Role-based authorization middleware factory
 * @param {Array<string>} allowedRoles - Array of roles that can access the route
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        if (!allowedRoles.includes(req.userRole)) {
            logger.warn(`Unauthorized access attempt by ${req.userRole} to ${req.path}`);
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
        }

        next();
    };
};

/**
 * Check if user is admin
 */
const isAdmin = (req, res, next) => {
    return authorize('ADMIN')(req, res, next);
};

/**
 * Check if user is customer
 */
const isCustomer = (req, res, next) => {
    return authorize('CUSTOMER')(req, res, next);
};

/**
 * Check if user is driver
 */
const isDriver = (req, res, next) => {
    return authorize('DRIVER')(req, res, next);
};

/**
 * Check if user is customer or driver (ride participants)
 */
const isParticipant = (req, res, next) => {
    return authorize('CUSTOMER', 'DRIVER')(req, res, next);
};

/**
 * Check if user has access to specific chat session
 */
const canAccessChat = async (req, res, next) => {
    try {
        const ChatSession = require('../models/ChatSession');
        const chatSessionId = req.params.chatSessionId || req.body.chatSessionId;

        if (!chatSessionId) {
            return res.status(400).json({
                success: false,
                message: 'Chat session ID is required.'
            });
        }

        const chatSession = await ChatSession.findById(chatSessionId);

        if (!chatSession) {
            return res.status(404).json({
                success: false,
                message: 'Chat session not found.'
            });
        }

        // Admin can access all chats
        if (req.userRole === 'ADMIN') {
            req.chatSession = chatSession;
            return next();
        }

        // Check if user is participant
        if (!chatSession.isParticipant(req.userId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You are not part of this chat.'
            });
        }

        req.chatSession = chatSession;
        next();
    } catch (error) {
        logger.error('Error in canAccessChat middleware:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking chat access.'
        });
    }
};

module.exports = {
    authorize,
    isAdmin,
    isCustomer,
    isDriver,
    isParticipant,
    canAccessChat
};
