const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
    passengerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Passenger ID is required']
    },

    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Driver ID is required']
    },

    status: {
        type: String,
        enum: {
            values: ['ACTIVE', 'CLOSED'],
            message: '{VALUE} is not a valid status'
        },
        default: 'ACTIVE'
    },

    lastMessageAt: {
        type: Date,
        default: null
    },

    messageCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes for faster queries
chatSessionSchema.index({ passengerId: 1 });
chatSessionSchema.index({ driverId: 1 });
chatSessionSchema.index({ status: 1 });
chatSessionSchema.index({ createdAt: -1 });

// Compound index for participant queries and unique active session check
chatSessionSchema.index({ passengerId: 1, driverId: 1 }, { unique: true });

// Virtual to check if session is active
chatSessionSchema.virtual('isActive').get(function () {
    return this.status === 'ACTIVE';
});

// Method to check if user is participant
chatSessionSchema.methods.isParticipant = function (userId) {
    const pId = this.passengerId._id ? this.passengerId._id : this.passengerId;
    const dId = this.driverId._id ? this.driverId._id : this.driverId;
    return pId.toString() === userId.toString() ||
        dId.toString() === userId.toString();
};

// Method to get other participant
chatSessionSchema.methods.getOtherParticipant = function (userId) {
    const pId = this.passengerId._id ? this.passengerId._id : this.passengerId;
    if (pId.toString() === userId.toString()) {
        return this.driverId;
    }
    return this.passengerId;
};

// Method to close session
chatSessionSchema.methods.close = function () {
    this.status = 'CLOSED';
    return this.save();
};

// Method to update last message timestamp
chatSessionSchema.methods.updateLastMessage = function () {
    this.lastMessageAt = new Date();
    this.messageCount += 1;
    return this.save();
};

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

module.exports = ChatSession;
