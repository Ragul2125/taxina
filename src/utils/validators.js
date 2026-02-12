const { body, param, validationResult } = require('express-validator');

// Validation middleware to check for errors
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

// Common validation rules
const validators = {
    // Admin Question validators
    createQuestion: [
        body('questionText')
            .trim()
            .notEmpty()
            .withMessage('Question text is required')
            .isLength({ min: 5, max: 500 })
            .withMessage('Question must be between 5 and 500 characters'),
        body('answers')
            .isArray({ min: 2 })
            .withMessage('At least 2 answers are required'),
        body('answers.*')
            .trim()
            .notEmpty()
            .withMessage('Answer cannot be empty'),
        body('isActive')
            .optional()
            .isBoolean()
            .withMessage('isActive must be a boolean'),
        validate
    ],

    updateQuestion: [
        param('id')
            .isMongoId()
            .withMessage('Invalid question ID'),
        body('questionText')
            .optional()
            .trim()
            .isLength({ min: 5, max: 500 })
            .withMessage('Question must be between 5 and 500 characters'),
        body('answers')
            .optional()
            .isArray({ min: 2 })
            .withMessage('At least 2 answers are required'),
        body('isActive')
            .optional()
            .isBoolean()
            .withMessage('isActive must be a boolean'),
        validate
    ],

    // Message validators
    sendMessage: [
        body('chatSessionId')
            .isMongoId()
            .withMessage('Invalid chat session ID'),
        body('senderId')
            .isMongoId()
            .withMessage('Invalid sender ID'),
        body('type')
            .isIn(['TEXT', 'VOICE', 'QUESTION', 'ANSWER'])
            .withMessage('Invalid message type'),
        body('text')
            .if(body('type').isIn(['TEXT', 'QUESTION', 'ANSWER']))
            .trim()
            .notEmpty()
            .withMessage('Text is required for this message type'),
        validate
    ]
};

// Export validate function separately for use in other routes
validators.validate = validate;

module.exports = validators;
