const User = require('../../models/User');
const ChatSession = require('../../models/ChatSession');
const logger = require('../../utils/logger');

/**
 * Handle socket connection
 */
const handleConnection = (io, socket) => {
    logger.info(`User connected: ${socket.userId} (${socket.userRole})`);

    // Update user online status
    updateUserStatus(socket.userId, true, socket.id);

    // Handle join chat room
    socket.on('join_chat', async (data) => {
        try {
            const { chatSessionId } = data;

            if (!chatSessionId) {
                socket.emit('error', { message: 'Chat ID is required' });
                return;
            }

            // Validate user belongs to chat
            const chatSession = await ChatSession.findById(chatSessionId);

            if (!chatSession) {
                socket.emit('error', { message: 'Chat session not found' });
                return;
            }

            const userId = socket.userId.toString();
            const isParticipant = chatSession.isParticipant(userId);
            const isAdmin = socket.userRole === 'ADMIN';

            if (!isParticipant && !isAdmin) {
                socket.emit('error', { message: 'Access denied. You are not part of this chat.' });
                return;
            }

            // Join chat room
            const roomName = `chat_${chatSessionId}`;
            socket.join(roomName);
            socket.currentChatId = chatSessionId;

            logger.info(`User ${socket.userId} joined room ${roomName}`);

            // Notify other participants
            socket.to(roomName).emit('user_joined', {
                userId: socket.userId,
                userName: socket.user.name,
                userRole: socket.userRole
            });

            // Send confirmation
            socket.emit('joined_chat', {
                chatSessionId,
                roomName,
                message: 'Successfully joined chat'
            });

        } catch (error) {
            logger.error('Error in join_chat:', error);
            socket.emit('error', { message: 'Failed to join chat' });
        }
    });

    // Handle leave chat room
    socket.on('leave_chat', (data) => {
        const { chatSessionId } = data;

        if (chatSessionId) {
            const roomName = `chat_${chatSessionId}`;
            socket.leave(roomName);
            socket.currentChatId = null;

            logger.info(`User ${socket.userId} left room ${roomName}`);

            // Notify other participants
            socket.to(roomName).emit('user_left', {
                userId: socket.userId,
                userName: socket.user.name,
                userRole: socket.userRole
            });
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.userId}`);

        // Update user online status
        updateUserStatus(socket.userId, false, null);

        // Notify rooms
        if (socket.currentChatId) {
            const roomName = `chat_${socket.currentChatId}`;
            socket.to(roomName).emit('user_left', {
                userId: socket.userId,
                userName: socket.user.name,
                userRole: socket.userRole
            });
        }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
        const { chatSessionId, isTyping } = data;

        if (chatSessionId) {
            const roomName = `chat_${chatSessionId}`;
            socket.to(roomName).emit('typing', {
                userId: socket.userId,
                userName: socket.user.name,
                isTyping
            });
        }
    });
};

/**
 * Update user online status
 */
const updateUserStatus = async (userId, isOnline, socketId) => {
    try {
        await User.findByIdAndUpdate(userId, {
            isOnline,
            socketId: isOnline ? socketId : null
        });

        // logger.debug(`Updated user ${userId} status: ${isOnline ? 'online' : 'offline'}`);
    } catch (error) {
        logger.error('Error updating user status:', error);
    }
};

module.exports = handleConnection;
