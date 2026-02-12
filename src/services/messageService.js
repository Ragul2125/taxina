const Message = require('../models/Message');
const ChatSession = require('../models/ChatSession');
const questionService = require('./questionService');
const logger = require('../utils/logger');

/**
 * Message Service
 * Business logic for message operations
 */
class MessageService {
    /**
     * Create and save a message
     */
    async createMessage(messageData) {
        try {
            const {
                chatSessionId,
                senderId,
                senderRole,
                type,
                text,
                voiceUrl,
                questionId,
                voiceDuration
            } = messageData;

            // Validate chat session exists
            const chatSession = await ChatSession.findById(chatSessionId);
            if (!chatSession) {
                throw new Error('Chat session not found');
            }

            // Validate chat session is active
            if (chatSession.status !== 'ACTIVE') {
                throw new Error('Chat session is not active');
            }

            // Create message
            const message = new Message({
                chatSessionId,
                senderId,
                senderRole,
                type,
                text,
                voiceUrl,
                questionId,
                voiceDuration
            });

            await message.save();

            // Update chat session
            await chatSession.updateLastMessage();

            // Increment question usage if applicable
            if (type === 'QUESTION' && questionId) {
                await questionService.incrementUsage(questionId);
            }

            logger.info(`Created ${type} message in chat session ${chatSessionId}`);

            // Populate sender and question details
            await message.populate('senderId', 'name role');
            if (questionId) {
                await message.populate('questionId', 'questionText answers');
            }

            return message;
        } catch (error) {
            logger.error('Error in createMessage:', error);
            throw error;
        }
    }

    /**
     * Get messages for a chat session
     */
    async getMessages(chatSessionId, options = {}) {
        try {
            const { limit = 100, skip = 0, before } = options;

            const query = { chatSessionId };

            // Get messages before a specific timestamp (for pagination)
            if (before) {
                query.createdAt = { $lt: new Date(before) };
            }

            const messages = await Message.find(query)
                .populate('senderId', 'name role')
                .populate('questionId', 'questionText answers')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            // Reverse to show oldest first
            return messages.reverse();
        } catch (error) {
            logger.error('Error in getMessages:', error);
            throw error;
        }
    }

    /**
     * Count messages for a chat session
     */
    async countMessages(chatSessionId) {
        try {
            const count = await Message.countDocuments({ chatSessionId });
            return count;
        } catch (error) {
            logger.error('Error in countMessages:', error);
            throw error;
        }
    }

    /**
     * Mark message as read
     */
    async markAsRead(messageId) {
        try {
            const message = await Message.findById(messageId);

            if (!message) {
                throw new Error('Message not found');
            }

            if (!message.isRead) {
                await message.markAsRead();
                logger.debug(`Marked message ${messageId} as read`);
            }

            return message;
        } catch (error) {
            logger.error('Error in markAsRead:', error);
            throw error;
        }
    }

    /**
     * Get unread messages count
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
     * Delete message
     */
    async deleteMessage(messageId) {
        try {
            const message = await Message.findByIdAndDelete(messageId);

            if (!message) {
                throw new Error('Message not found');
            }

            logger.info(`Deleted message ${messageId}`);
            return message;
        } catch (error) {
            logger.error('Error in deleteMessage:', error);
            throw error;
        }
    }

    /**
     * Get message statistics for a chat session
     */
    async getMessageStats(chatSessionId) {
        try {
            const stats = await Message.aggregate([
                { $match: { chatSessionId } },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const result = {
                total: 0,
                byType: {}
            };

            stats.forEach(stat => {
                result.byType[stat._id] = stat.count;
                result.total += stat.count;
            });

            return result;
        } catch (error) {
            logger.error('Error in getMessageStats:', error);
            throw error;
        }
    }

    /**
     * Search messages
     */
    async searchMessages(chatSessionId, searchTerm) {
        try {
            const messages = await Message.find({
                chatSessionId,
                type: { $in: ['TEXT', 'QUESTION', 'ANSWER'] },
                text: { $regex: searchTerm, $options: 'i' }
            })
                .populate('senderId', 'name role')
                .sort({ createdAt: -1 })
                .limit(50);

            return messages;
        } catch (error) {
            logger.error('Error in searchMessages:', error);
            throw error;
        }
    }
}

module.exports = new MessageService();
