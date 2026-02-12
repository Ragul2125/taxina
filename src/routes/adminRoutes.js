const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleAuth');
const validators = require('../utils/validators');

// All admin routes require authentication and admin role
router.use(auth);

// Question management routes
router.post(
    '/questions',
    isAdmin,
    validators.createQuestion,
    adminController.createQuestion
);

router.get(
    '/questions',
    isAdmin,
    adminController.getAllQuestions
);

router.get(
    '/questions/active',
    adminController.getActiveQuestions
);

router.get(
    '/questions/popular',
    isAdmin,
    adminController.getPopularQuestions
);

router.get(
    '/questions/:id',
    isAdmin,
    adminController.getQuestionById
);

router.put(
    '/questions/:id',
    isAdmin,
    validators.updateQuestion,
    adminController.updateQuestion
);

router.delete(
    '/questions/:id',
    isAdmin,
    adminController.deleteQuestion
);

router.patch(
    '/questions/:id/toggle',
    isAdmin,
    adminController.toggleQuestionStatus
);

module.exports = router;
