const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { auth } = require('../middleware/auth');
const { uploadVoice } = require('../middleware/upload');

// All chat routes require authentication
router.use(auth);

// Create or get chat session
router.post(
    '/create',
    chatController.createChatSession
);

// Get chat history
router.get(
    '/history/:sessionId',
    chatController.getChatHistory
);

// Upload voice message
router.post(
    '/upload-voice',
    uploadVoice,
    chatController.uploadVoiceMessage
);

// Get chat session
router.get(
    '/session/:sessionId',
    chatController.getChatSession
);

// Get user's chat sessions
router.get(
    '/list',
    chatController.getUserChatSessions
);

// Get unread count
router.get(
    '/unread/:sessionId',
    chatController.getUnreadCount
);

// Mark messages as read
router.post(
    '/mark-read/:sessionId',
    chatController.markMessagesAsRead
);
// Search messages
router.get(
    '/search/:sessionId',
    chatController.searchMessages
);

module.exports = router;
