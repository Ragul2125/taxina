const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');


const register = asyncHandler(async (req, res) => {
    const { name, phone, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ phone });

    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'User with this phone number already exists'
        });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
        name,
        phone,
        password: hashedPassword,
        role: role || 'CUSTOMER' // Default to CUSTOMER
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    logger.info(`New user registered: ${user._id} (${user.role})`);

    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                role: user.role
            },
            token
        }
    });
});


const login = asyncHandler(async (req, res) => {
    const { phone, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ phone }).select('+password');

    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid phone number or password'
        });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(401).json({
            success: false,
            message: 'Invalid phone number or password'
        });
    }

    // Generate token
    const token = generateToken(user._id);

    // Update online status
    user.isOnline = true;
    await user.save();

    logger.info(`User logged in: ${user._id} (${user.role})`);

    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                role: user.role,
                isOnline: user.isOnline
            },
            token
        }
    });
});


const logout = asyncHandler(async (req, res) => {
    // Update user online status
    await User.findByIdAndUpdate(req.userId, {
        isOnline: false,
        socketId: null
    });

    logger.info(`User logged out: ${req.userId}`);

    res.json({
        success: true,
        message: 'Logout successful'
    });
});


const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);

    res.json({
        success: true,
        data: {
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                role: user.role,
                isOnline: user.isOnline,
                createdAt: user.createdAt
            }
        }
    });
});


const updateProfile = asyncHandler(async (req, res) => {
    const { name } = req.body;

    const user = await User.findById(req.userId);

    if (name) {
        user.name = name;
    }

    await user.save();

    logger.info(`User profile updated: ${user._id}`);

    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                role: user.role
            }
        }
    });
});


const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.userId).select('+password');

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
        return res.status(401).json({
            success: false,
            message: 'Current password is incorrect'
        });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    logger.info(`Password changed for user: ${user._id}`);

    res.json({
        success: true,
        message: 'Password changed successfully'
    });
});

module.exports = {
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    changePassword
};
