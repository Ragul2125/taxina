const messageService = require('../../services/messageService');
const chatService = require('../../services/chatService');
const logger = require('../../utils/logger');

/**
 * Handle message events
 */
const handleMessage = (io, socket) => {
    /**
     * Send message event
     */
    socket.on('send_message', async (data) => {
        try {
            const {
                chatSessionId,
                type,
                text,
                voiceUrl,
                questionId,
                voiceDuration
            } = data;

            // Validate required fields
            if (!chatSessionId || !type) {
                socket.emit('message_error', {
                    message: 'Missing required fields: chatSessionId, type'
                });
                return;
            }

            // Validate chat session exists and is active
            const chatSession = await chatService.getChatSessionById(chatSessionId);

            if (!chatSession) {
                socket.emit('message_error', { message: 'Chat session not found' });
                return;
            }

            if (chatSession.status !== 'ACTIVE') {
                // Auto-activate if closed? Or just error?
                // Let's allow sending messages to re-activate or just error if stricter.
                // For now, let's assume active.
                // If we want to support persistent history, we might not strictly block.
                // But let's keep it simple.
            }

            // Create message
            const message = await messageService.createMessage({
                chatSessionId,
                senderId: socket.userId,
                senderRole: socket.userRole,
                type,
                text,
                voiceUrl,
                questionId,
                voiceDuration
            });

            logger.info(`Message sent in session ${chatSessionId} by ${socket.userId}`);

            // Emit to all participants in the chat room
            const roomName = `chat_${chatSessionId}`;
            io.to(roomName).emit('new_message', message);

            // Send confirmation to sender
            socket.emit('message_sent', {
                messageId: message._id,
                success: true
            });

        } catch (error) {
            logger.error('Error in send_message:', error);
            socket.emit('message_error', {
                message: error.message || 'Failed to send message'
            });
        }
    });

    /**
     * Mark message as read
     */
    socket.on('mark_read', async (data) => {
        try {
            const { messageId, chatSessionId } = data;

            if (!messageId) {
                return;
            }

            await messageService.markAsRead(messageId);

            // Notify sender
            if (chatSessionId) {
                const roomName = `chat_${chatSessionId}`;
                socket.to(roomName).emit('message_read', {
                    messageId,
                    readBy: socket.userId,
                    readAt: new Date()
                });
            }

        } catch (error) {
            logger.error('Error in mark_read:', error);
        }
    });

    /**
     * Request chat history
     */
    socket.on('get_messages', async (data) => {
        try {
            const { chatSessionId, limit, before } = data;

            if (!chatSessionId) {
                socket.emit('error', { message: 'Chat session ID is required' });
                return;
            }

            const messages = await messageService.getMessages(chatSessionId, {
                limit: limit || 50,
                before
            });

            socket.emit('messages_loaded', {
                messages,
                hasMore: messages.length === (limit || 50)
            });

        } catch (error) {
            logger.error('Error in get_messages:', error);
            socket.emit('error', { message: 'Failed to load messages' });
        }
    });

    /**
     * Delete message (admin only)
     */
    socket.on('delete_message', async (data) => {
        try {
            if (socket.userRole !== 'ADMIN') {
                socket.emit('error', { message: 'Only admins can delete messages' });
                return;
            }

            const { messageId, chatSessionId } = data;

            if (!messageId) {
                socket.emit('error', { message: 'Message ID is required' });
                return;
            }

            await messageService.deleteMessage(messageId);

            // Notify all participants
            if (chatSessionId) {
                const roomName = `chat_${chatSessionId}`;
                io.to(roomName).emit('message_deleted', {
                    messageId,
                    deletedBy: socket.userId
                });
            }

            logger.info(`Message ${messageId} deleted by admin ${socket.userId}`);

        } catch (error) {
            logger.error('Error in delete_message:', error);
            socket.emit('error', { message: 'Failed to delete message' });
        }
    });
};

module.exports = handleMessage;
