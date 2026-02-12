const http = require('http');
const createApp = require('./src/app');
const connectDatabase = require('./src/config/database');
const initializeSocket = require('./src/websocket/socketManager');
const config = require('./src/config/env');
const logger = require('./src/utils/logger');

const startServer = async () => {
    try {
        await connectDatabase();
        const app = createApp();
        const httpServer = http.createServer(app);
        const io = initializeSocket(httpServer);

        app.set('io', io);

        const PORT = config.port;
        httpServer.listen(PORT, () => {
            logger.success(`Server running on port ${PORT}`);
            logger.info(`Environment: ${config.nodeEnv}`);
        });

        process.on('SIGTERM', () => {
            logger.info('SIGTERM received');
            httpServer.close(() => {
                logger.info('Server closed');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            logger.info('SIGINT received');
            httpServer.close(() => {
                logger.info('Server closed');
                process.exit(0);
            });
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
