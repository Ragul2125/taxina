const { Server } = require('socket.io');
const socketAuth = require('./middleware/socketAuth');
const handleConnection = require('./handlers/connectionHandler');
const handleMessage = require('./handlers/messageHandler');
const handleQuestion = require('./handlers/questionHandler');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Initialize Socket.io server
 */
const initializeSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: config.cors.allowedOrigins,
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Authentication middleware
    io.use(socketAuth);

    // Connection handler
    io.on('connection', (socket) => {
        // Handle connection events
        handleConnection(io, socket);

        // Handle message events
        handleMessage(io, socket);

        // Handle question events
        handleQuestion(io, socket);
    });

    // Error handling
    io.on('error', (error) => {
        logger.error('Socket.io error:', error);
    });

    logger.success('Socket.io server initialized');

    return io;
};

module.exports = initializeSocket;
