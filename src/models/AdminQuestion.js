const mongoose = require('mongoose');

const adminQuestionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: [true, 'Question text is required'],
        trim: true,
        minlength: [5, 'Question must be at least 5 characters'],
        maxlength: [500, 'Question cannot exceed 500 characters']
    },

    answers: {
        type: [String],
        required: [true, 'Answers are required'],
        validate: {
            validator: function (arr) {
                return arr && arr.length >= 2;
            },
            message: 'At least 2 answers are required'
        }
    },

    isActive: {
        type: Boolean,
        default: true
    },

    // Metadata
    usageCount: {
        type: Number,
        default: 0
    },

    category: {
        type: String,
        trim: true,
        default: 'General'
    },

    priority: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    }
}, {
    timestamps: true
});

// Indexes for faster queries
adminQuestionSchema.index({ isActive: 1 });
adminQuestionSchema.index({ category: 1 });
adminQuestionSchema.index({ priority: -1 });
adminQuestionSchema.index({ usageCount: -1 });

// Compound index for active questions sorted by priority
adminQuestionSchema.index({ isActive: 1, priority: -1 });

// Method to increment usage count
adminQuestionSchema.methods.incrementUsage = function () {
    this.usageCount += 1;
    return this.save();
};

// Method to toggle active status
adminQuestionSchema.methods.toggleActive = function () {
    this.isActive = !this.isActive;
    return this.save();
};

// Static method to get active questions
adminQuestionSchema.statics.getActiveQuestions = function () {
    return this.find({ isActive: true })
        .sort({ priority: -1, createdAt: -1 })
        .select('questionText answers category priority');
};

// Static method to get popular questions
adminQuestionSchema.statics.getPopularQuestions = function (limit = 10) {
    return this.find({ isActive: true })
        .sort({ usageCount: -1 })
        .limit(limit)
        .select('questionText answers usageCount');
};

// Virtual for answer count
adminQuestionSchema.virtual('answerCount').get(function () {
    return this.answers ? this.answers.length : 0;
});

// Pre-save validation
adminQuestionSchema.pre('save', function (next) {
    // Trim all answers
    if (this.answers && Array.isArray(this.answers)) {
        this.answers = this.answers.map(answer => answer.trim()).filter(answer => answer.length > 0);

        // Remove duplicates
        this.answers = [...new Set(this.answers)];

        if (this.answers.length < 2) {
            return next(new Error('At least 2 unique answers are required'));
        }
    }

    next();
});

const AdminQuestion = mongoose.model('AdminQuestion', adminQuestionSchema);

module.exports = AdminQuestion;
