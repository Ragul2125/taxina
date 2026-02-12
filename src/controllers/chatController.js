const chatService = require('../services/chatService');
const messageService = require('../services/messageService');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const ChatSession = require('../models/ChatSession');

/**
 * Chat Controller
 * Handles HTTP requests for chat operations
 */

/**
 * @route   POST /api/chat/create
 * @desc    Create or get existing chat session
 * @access  Customer
 */
const createChatSession = asyncHandler(async (req, res) => {
    const { driverId } = req.body;
    const passengerId = req.userId; // valid from auth middleware

    if (!driverId) {
        return res.status(400).json({
            success: false,
            message: 'Driver ID is required'
        });
    }

    // Check if session exists
    let chatSession = await ChatSession.findOne({
        passengerId,
        driverId
    });

    if (!chatSession) {
        chatSession = await ChatSession.create({
            passengerId,
            driverId,
            status: 'ACTIVE'
        });
    } else if (chatSession.status === 'CLOSED') {
        chatSession.status = 'ACTIVE';
        await chatSession.save();
    }

    res.status(201).json({
        success: true,
        data: chatSession
    });
});

/**
 * @route   GET /api/chat/history/:sessionId
 * @desc    Get chat history for a session
 * @access  Customer, Driver, Admin
 */
const getChatHistory = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const skip = parseInt(req.query.skip) || 0;

    // Validate access - simplistic check, normally service handles this
    const session = await ChatSession.findById(sessionId);
    if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (req.userRole !== 'ADMIN' && !session.isParticipant(req.userId)) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const messages = await messageService.getMessages(sessionId, { limit, skip });
    const totalMessages = await messageService.countMessages(sessionId);

    res.json({
        success: true,
        data: {
            chatSession: session,
            messages: messages,
            totalMessages: totalMessages
        }
    });
});

/**
 * @route   POST /api/chat/upload-voice
 * @desc    Upload voice message
 * @access  Customer, Driver
 */
const uploadVoiceMessage = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No voice file uploaded'
        });
    }

    res.json({
        success: true,
        message: 'Voice file uploaded successfully',
        data: {
            voiceUrl: req.voiceUrl,
            // In a real app, you might return the full URL or relative path handled by frontend
            filename: req.file.filename,
            size: req.file.size
        }
    });
});

/**
 * @route   GET /api/chat/session/:sessionId
 * @desc    Get chat session details
 * @access  Customer, Driver, Admin
 */
const getChatSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const chatSession = await ChatSession.findById(sessionId)
        .populate('passengerId', 'name email')
        .populate('driverId', 'name email');

    if (!chatSession) {
        return res.status(404).json({
            success: false,
            message: 'Chat session not found'
        });
    }

    if (req.userRole !== 'ADMIN' && !chatSession.isParticipant(req.userId)) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({
        success: true,
        data: chatSession
    });
});

/**
 * @route   GET /api/chat/list
 * @desc    List user's chat sessions
 * @access  Customer, Driver
 */
const getUserChatSessions = asyncHandler(async (req, res) => {
    const query = req.userRole === 'DRIVER' ? { driverId: req.userId } : { passengerId: req.userId };

    const sessions = await ChatSession.find(query)
        .sort({ updatedAt: -1 })
        .populate('passengerId', 'name')
        .populate('driverId', 'name');

    res.json({
        success: true,
        data: sessions
    });
});

/**
 * @route   GET /api/chat/unread/:sessionId
 * @desc    Get unread message count
 * @access  Customer, Driver
 */
const getUnreadCount = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const count = await messageService.getUnreadCount(sessionId, req.userId);

    res.json({
        success: true,
        data: {
            unreadCount: count
        }
    });
});

/**
 * @route   POST /api/chat/mark-read/:sessionId
 * @desc    Mark messages as read
 * @access  Customer, Driver
 */
const markMessagesAsRead = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const count = await messageService.markMessagesAsRead(sessionId, req.userId);

    res.json({
        success: true,
        message: `Marked ${count} messages as read`,
        data: {
            markedCount: count
        }
    });
});


/**
 * @route   GET /api/chat/search/:sessionId
 * @desc    Search messages in a chat session
 * @access  Customer, Driver, Admin
 */
const searchMessages = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const session = await ChatSession.findById(sessionId);
    if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (req.userRole !== 'ADMIN' && !session.isParticipant(req.userId)) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const messages = await messageService.searchMessages(sessionId, q);

    res.json({
        success: true,
        data: messages
    });
});

module.exports = {
    createChatSession,
    getChatHistory,
    uploadVoiceMessage,
    getChatSession,
    getUserChatSessions,
    getUnreadCount,
    markMessagesAsRead,
    searchMessages
};
