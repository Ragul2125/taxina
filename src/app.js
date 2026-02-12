const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/env');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');


const createApp = () => {
    const app = express();

    // CORS configuration
    app.use(cors({
        origin: config.cors.allowedOrigins,
        credentials: true
    }));

    // Body parser middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Serve static files (uploaded voices)
    app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    // Request logging middleware (development only)
    if (config.nodeEnv === 'development') {
        app.use((req, res, next) => {
            logger.debug(`${req.method} ${req.path}`);
            next();
        });
    }

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({
            success: true,
            message: 'Server is running',
            timestamp: new Date().toISOString(),
            environment: config.nodeEnv
        });
    });

    // API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/chat', chatRoutes);

    // Root endpoint
    app.get('/', (req, res) => {
        res.json({
            success: true,
            message: 'Welcome to Taxina Chat API',
            version: '1.0.0',
            endpoints: {
                health: '/health',
                auth: '/api/auth',
                admin: '/api/admin',
                chat: '/api/chat'
            }
        });
    });

    // 404 handler
    app.use(notFound);

    // Global error handler
    app.use(errorHandler);

    return app;
};

module.exports = createApp;
