const questionService = require('../../services/questionService');
const logger = require('../../utils/logger');

/**
 * Handle question-related events
 */
const handleQuestion = (io, socket) => {
    /**
     * Get active admin questions
     */
    socket.on('get_admin_questions', async () => {
        try {
            const questions = await questionService.getActiveQuestions();

            socket.emit('admin_questions', {
                questions,
                count: questions.length
            });

            logger.debug(`Sent ${questions.length} active questions to user ${socket.userId}`);

        } catch (error) {
            logger.error('Error in get_admin_questions:', error);
            socket.emit('error', { message: 'Failed to load questions' });
        }
    });

    /**
     * Get answers for a specific question (for driver)
     */
    socket.on('driver_get_answers', async (data) => {
        try {
            const { questionId } = data;

            if (!questionId) {
                socket.emit('error', { message: 'Question ID is required' });
                return;
            }

            // Only drivers should request answers
            if (socket.userRole !== 'DRIVER' && socket.userRole !== 'ADMIN') {
                socket.emit('error', { message: 'Only drivers can request answers' });
                return;
            }

            const questionData = await questionService.getAnswersForQuestion(questionId);

            socket.emit('question_answers', questionData);

            logger.debug(`Sent answers for question ${questionId} to driver ${socket.userId}`);

        } catch (error) {
            logger.error('Error in driver_get_answers:', error);
            socket.emit('error', { message: 'Failed to load answers' });
        }
    });

    /**
     * Get questions by category
     */
    socket.on('get_questions_by_category', async (data) => {
        try {
            const { category } = data;

            if (!category) {
                socket.emit('error', { message: 'Category is required' });
                return;
            }

            const questions = await questionService.getQuestionsByCategory(category);

            socket.emit('category_questions', {
                category,
                questions,
                count: questions.length
            });

        } catch (error) {
            logger.error('Error in get_questions_by_category:', error);
            socket.emit('error', { message: 'Failed to load category questions' });
        }
    });

    /**
     * Notify when a question is tapped (customer)
     */
    socket.on('question_tapped', async (data) => {
        try {
            const { questionId, chatSessionId } = data;

            if (!questionId || !chatSessionId) {
                return;
            }

            // Get question details
            const questionData = await questionService.getAnswersForQuestion(questionId);

            // Notify driver in the same chat room
            const roomName = `chat_${chatSessionId}`;
            socket.to(roomName).emit('customer_asked_question', {
                question: questionData,
                askedBy: socket.userId,
                askedByName: socket.user.name
            });

            logger.info(`Customer ${socket.userId} tapped question ${questionId} in chat ${chatSessionId}`);

        } catch (error) {
            logger.error('Error in question_tapped:', error);
        }
    });

    /**
     * Notify when driver selects an answer
     */
    socket.on('answer_selected', (data) => {
        try {
            const { questionId, answer, chatSessionId } = data;

            if (!questionId || !answer || !chatSessionId) {
                return;
            }

            // Notify customer in the same chat room
            const roomName = `chat_${chatSessionId}`;
            socket.to(roomName).emit('driver_answered', {
                questionId,
                answer,
                answeredBy: socket.userId,
                answeredByName: socket.user.name
            });

            logger.info(`Driver ${socket.userId} selected answer for question ${questionId} in chat ${chatSessionId}`);

        } catch (error) {
            logger.error('Error in answer_selected:', error);
        }
    });
};

module.exports = handleQuestion;
