const questionService = require('../services/questionService');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Admin Controller
 * Handles HTTP requests for admin operations
 */

/**
 * @route   POST /api/admin/questions
 * @desc    Create a new question
 * @access  Admin
 */
const createQuestion = asyncHandler(async (req, res) => {
    const { questionText, answers, isActive, category, priority } = req.body;

    const question = await questionService.createQuestion({
        questionText,
        answers,
        isActive,
        category,
        priority
    });

    res.status(201).json({
        success: true,
        message: 'Question created successfully',
        data: question
    });
});

/**
 * @route   GET /api/admin/questions
 * @desc    Get all questions
 * @access  Admin
 */
const getAllQuestions = asyncHandler(async (req, res) => {
    const { isActive, category } = req.query;

    const filters = {};
    if (isActive !== undefined) {
        filters.isActive = isActive === 'true';
    }
    if (category) {
        filters.category = category;
    }

    const questions = await questionService.getAllQuestions(filters);

    res.json({
        success: true,
        count: questions.length,
        data: questions
    });
});

/**
 * @route   GET /api/admin/questions/active
 * @desc    Get active questions
 * @access  Admin, Customer, Driver
 */
const getActiveQuestions = asyncHandler(async (req, res) => {
    const questions = await questionService.getActiveQuestions();

    res.json({
        success: true,
        count: questions.length,
        data: questions
    });
});

/**
 * @route   GET /api/admin/questions/:id
 * @desc    Get question by ID
 * @access  Admin
 */
const getQuestionById = asyncHandler(async (req, res) => {
    const question = await questionService.getQuestionById(req.params.id);

    res.json({
        success: true,
        data: question
    });
});

/**
 * @route   PUT /api/admin/questions/:id
 * @desc    Update question
 * @access  Admin
 */
const updateQuestion = asyncHandler(async (req, res) => {
    const { questionText, answers, isActive, category, priority } = req.body;

    const updateData = {};
    if (questionText) updateData.questionText = questionText;
    if (answers) updateData.answers = answers;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (category) updateData.category = category;
    if (priority !== undefined) updateData.priority = priority;

    const question = await questionService.updateQuestion(req.params.id, updateData);

    res.json({
        success: true,
        message: 'Question updated successfully',
        data: question
    });
});

/**
 * @route   DELETE /api/admin/questions/:id
 * @desc    Delete question
 * @access  Admin
 */
const deleteQuestion = asyncHandler(async (req, res) => {
    await questionService.deleteQuestion(req.params.id);

    res.json({
        success: true,
        message: 'Question deleted successfully'
    });
});

/**
 * @route   PATCH /api/admin/questions/:id/toggle
 * @desc    Toggle question active status
 * @access  Admin
 */
const toggleQuestionStatus = asyncHandler(async (req, res) => {
    const question = await questionService.toggleQuestionStatus(req.params.id);

    res.json({
        success: true,
        message: `Question ${question.isActive ? 'activated' : 'deactivated'} successfully`,
        data: question
    });
});

/**
 * @route   GET /api/admin/questions/popular
 * @desc    Get popular questions
 * @access  Admin
 */
const getPopularQuestions = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const questions = await questionService.getPopularQuestions(limit);

    res.json({
        success: true,
        count: questions.length,
        data: questions
    });
});

module.exports = {
    createQuestion,
    getAllQuestions,
    getActiveQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    toggleQuestionStatus,
    getPopularQuestions
};
