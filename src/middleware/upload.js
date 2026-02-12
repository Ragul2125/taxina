const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/env');
const logger = require('../utils/logger');

// Ensure upload directory exists
const uploadDir = config.upload.uploadPath;
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    logger.info(`Created upload directory: ${uploadDir}`);
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: timestamp-userId-originalname
        const userId = req.userId || 'anonymous';
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const filename = `voice-${timestamp}-${userId}${ext}`;
        cb(null, filename);
    }
});

// File filter for voice messages
const fileFilter = (req, file, cb) => {
    // Allowed audio formats
    const allowedMimes = [
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
        'audio/webm',
        'audio/m4a',
        'audio/aac',
        'audio/x-m4a'
    ];

    const allowedExtensions = ['.mp3', '.wav', '.ogg', '.webm', '.m4a', '.aac'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only audio files are allowed.'), false);
    }
};

// Create multer upload instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: config.upload.maxFileSize // 5MB default
    }
});

// Middleware for single voice file upload
const uploadVoice = upload.single('voice');

// Error handling wrapper
const handleUpload = (req, res, next) => {
    uploadVoice(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Multer-specific errors
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: `File too large. Maximum size is ${config.upload.maxFileSize / (1024 * 1024)}MB.`
                });
            }

            return res.status(400).json({
                success: false,
                message: `Upload error: ${err.message}`
            });
        } else if (err) {
            // Custom errors
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded.'
            });
        }

        // Attach file URL to request
        req.voiceUrl = `/uploads/voices/${req.file.filename}`;

        logger.info(`Voice file uploaded: ${req.file.filename}`);
        next();
    });
};

// Utility function to delete voice file
const deleteVoiceFile = (filename) => {
    try {
        const filePath = path.join(uploadDir, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            logger.info(`Deleted voice file: ${filename}`);
            return true;
        }
        return false;
    } catch (error) {
        logger.error(`Error deleting voice file ${filename}:`, error);
        return false;
    }
};

module.exports = {
    uploadVoice: handleUpload,
    deleteVoiceFile
};
