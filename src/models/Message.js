const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    chatSessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatSession',
        required: [true, 'Chat session ID is required']
    },

    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Sender ID is required']
    },

    senderRole: {
        type: String,
        enum: {
            values: ['CUSTOMER', 'DRIVER', 'ADMIN'],
            message: '{VALUE} is not a valid sender role'
        },
        required: [true, 'Sender role is required']
    },

    type: {
        type: String,
        enum: {
            values: ['TEXT', 'VOICE', 'QUESTION', 'ANSWER'],
            message: '{VALUE} is not a valid message type'
        },
        required: [true, 'Message type is required']
    },

    text: {
        type: String,
        trim: true,
        maxlength: [2000, 'Message text cannot exceed 2000 characters']
    },

    voiceUrl: {
        type: String,
        trim: true
    },

    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminQuestion',
        default: null
    },

    // Metadata
    isRead: {
        type: Boolean,
        default: false
    },

    readAt: {
        type: Date,
        default: null
    },

    // For voice messages
    voiceDuration: {
        type: Number, // in seconds
        default: null
    }
}, {
    timestamps: true
});

// Indexes for faster queries
messageSchema.index({ chatSessionId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ type: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ isRead: 1 });

// Compound index for unread messages
messageSchema.index({ chatSessionId: 1, isRead: 1 });

// Validation: Ensure required fields based on message type
messageSchema.pre('save', function (next) {
    // TEXT, QUESTION, ANSWER require text
    if (['TEXT', 'QUESTION', 'ANSWER'].includes(this.type) && !this.text) {
        return next(new Error(`Text is required for ${this.type} message type`));
    }

    // VOICE requires voiceUrl
    if (this.type === 'VOICE' && !this.voiceUrl) {
        return next(new Error('Voice URL is required for VOICE message type'));
    }

    // QUESTION and ANSWER should have questionId
    if (['QUESTION', 'ANSWER'].includes(this.type) && !this.questionId) {
        return next(new Error(`Question ID is required for ${this.type} message type`));
    }

    next();
});

// Method to mark as read
messageSchema.methods.markAsRead = function () {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
};

// Static method to get unread count
messageSchema.statics.getUnreadCount = function (chatSessionId, userId) {
    return this.countDocuments({
        chatSessionId,
        senderId: { $ne: userId },
        isRead: false
    });
};

// Virtual for formatted timestamp
messageSchema.virtual('formattedTime').get(function () {
    return this.createdAt.toLocaleTimeString();
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
