const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },

    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true,
        match: [/^[0-9]{10,15}$/, 'Please provide a valid phone number']
    },

    role: {
        type: String,
        enum: {
            values: ['ADMIN', 'CUSTOMER', 'DRIVER'],
            message: '{VALUE} is not a valid role'
        },
        required: [true, 'Role is required']
    },

    socketId: {
        type: String,
        default: null
    },

    isOnline: {
        type: Boolean,
        default: false
    },

    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
    }
}, {
    timestamps: true
});

// Index for faster queries
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isOnline: 1 });

// Virtual for user's full profile
userSchema.virtual('profile').get(function () {
    return {
        id: this._id,
        name: this.name,
        phone: this.phone,
        role: this.role,
        isOnline: this.isOnline
    };
});

// Method to check if user is available for ride
userSchema.methods.isAvailable = function () {
    return this.isOnline && (this.role === 'DRIVER' || this.role === 'CUSTOMER');
};

const User = mongoose.model('User', userSchema);

module.exports = User;
