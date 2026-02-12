const config = require('../config/env');

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const getTimestamp = () => {
    return new Date().toISOString();
};

const logger = {
    info: (...args) => {
        console.log(`${colors.cyan}[INFO]${colors.reset} ${getTimestamp()}:`, ...args);
    },

    error: (...args) => {
        console.error(`${colors.red}[ERROR]${colors.reset} ${getTimestamp()}:`, ...args);
    },

    warn: (...args) => {
        console.warn(`${colors.yellow}[WARN]${colors.reset} ${getTimestamp()}:`, ...args);
    },

    success: (...args) => {
        console.log(`${colors.green}[SUCCESS]${colors.reset} ${getTimestamp()}:`, ...args);
    },

    debug: (...args) => {
        if (config.nodeEnv === 'development') {
            console.log(`${colors.magenta}[DEBUG]${colors.reset} ${getTimestamp()}:`, ...args);
        }
    }
};

module.exports = logger;
