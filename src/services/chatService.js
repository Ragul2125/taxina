const ChatSession = require('../models/ChatSession');
const Message = require('../models/Message');
const logger = require('../utils/logger');

/**
 * Chat Service
 * Business logic for chat operations
 */
class ChatService {
    /**
     * Create or get chat session
     */
    async getOrCreateChatSession(passengerId, driverId) {
        try {
            // Check if chat session already exists
            let chatSession = await ChatSession.findOne({ passengerId, driverId });

            if (chatSession) {
                logger.debug(`Chat session found for passenger ${passengerId} and driver ${driverId}`);
                if (chatSession.status === 'CLOSED') {
                    chatSession.status = 'ACTIVE';
                    await chatSession.save();
                }
                return chatSession;
            }

            // Create new chat session
            chatSession = new ChatSession({
                passengerId,
                driverId,
                status: 'ACTIVE'
            });

            await chatSession.save();
            logger.info(`Created chat session for passenger ${passengerId} and driver ${driverId}`);

            return chatSession;
        } catch (error) {
            logger.error('Error in getOrCreateChatSession:', error);
            throw error;
        }
    }

    /**
     * Get chat session by ID
     */
    async getChatSessionById(chatSessionId) {
        try {
            const chatSession = await ChatSession.findById(chatSessionId)
                .populate('passengerId', 'name phone role')
                .populate('driverId', 'name phone role');

            return chatSession;
        } catch (error) {
            logger.error('Error in getChatSessionById:', error);
            throw error;
        }
    }

    /**
     * Get chat history
     */
    async getChatHistory(chatSessionId, options = {}) {
        try {
            const { limit = 100, skip = 0, sort = { createdAt: 1 } } = options;

            const chatSession = await ChatSession.findById(chatSessionId);

            if (!chatSession) {
                throw new Error('Chat session not found');
            }

            const messages = await Message.find({ chatSessionId })
                .populate('senderId', 'name role')
                .populate('questionId', 'questionText answers')
                .sort(sort)
                .skip(skip)
                .limit(limit);

            return {
                chatSession,
                messages,
                totalMessages: chatSession.messageCount
            };
        } catch (error) {
            logger.error('Error in getChatHistory:', error);
            throw error;
        }
    }

    /**
     * Get unread message count
     */
    async getUnreadCount(chatSessionId, userId) {
        try {
            const count = await Message.getUnreadCount(chatSessionId, userId);
            return count;
        } catch (error) {
            logger.error('Error in getUnreadCount:', error);
            throw error;
        }
    }

    /**
     * Mark messages as read
     */
    async markMessagesAsRead(chatSessionId, userId) {
        try {
            const result = await Message.updateMany(
                {
                    chatSessionId,
                    senderId: { $ne: userId },
                    isRead: false
                },
                {
                    $set: {
                        isRead: true,
                        readAt: new Date()
                    }
                }
            );

            logger.debug(`Marked ${result.modifiedCount} messages as read`);
            return result.modifiedCount;
        } catch (error) {
            logger.error('Error in markMessagesAsRead:', error);
            throw error;
        }
    }
}

module.exports = new ChatService();
