const AdminQuestion = require('../models/AdminQuestion');
const logger = require('../utils/logger');

/**
 * Question Service
 * Business logic for admin questions
 */
class QuestionService {
    /**
     * Create a new question
     */
    async createQuestion(questionData) {
        try {
            const question = new AdminQuestion(questionData);
            await question.save();

            logger.info(`Created question: ${question._id}`);
            return question;
        } catch (error) {
            logger.error('Error in createQuestion:', error);
            throw error;
        }
    }

    /**
     * Get all questions
     */
    async getAllQuestions(filters = {}) {
        try {
            const { isActive, category } = filters;
            const query = {};

            if (isActive !== undefined) {
                query.isActive = isActive;
            }

            if (category) {
                query.category = category;
            }

            const questions = await AdminQuestion.find(query)
                .sort({ priority: -1, createdAt: -1 });

            return questions;
        } catch (error) {
            logger.error('Error in getAllQuestions:', error);
            throw error;
        }
    }

    /**
     * Get active questions
     */
    async getActiveQuestions() {
        try {
            const questions = await AdminQuestion.getActiveQuestions();
            return questions;
        } catch (error) {
            logger.error('Error in getActiveQuestions:', error);
            throw error;
        }
    }

    /**
     * Get question by ID
     */
    async getQuestionById(questionId) {
        try {
            const question = await AdminQuestion.findById(questionId);

            if (!question) {
                throw new Error('Question not found');
            }

            return question;
        } catch (error) {
            logger.error('Error in getQuestionById:', error);
            throw error;
        }
    }

    /**
     * Update question
     */
    async updateQuestion(questionId, updateData) {
        try {
            const question = await AdminQuestion.findById(questionId);

            if (!question) {
                throw new Error('Question not found');
            }

            // Update fields
            Object.keys(updateData).forEach(key => {
                question[key] = updateData[key];
            });

            await question.save();

            logger.info(`Updated question: ${questionId}`);
            return question;
        } catch (error) {
            logger.error('Error in updateQuestion:', error);
            throw error;
        }
    }

    /**
     * Delete question
     */
    async deleteQuestion(questionId) {
        try {
            const question = await AdminQuestion.findByIdAndDelete(questionId);

            if (!question) {
                throw new Error('Question not found');
            }

            logger.info(`Deleted question: ${questionId}`);
            return question;
        } catch (error) {
            logger.error('Error in deleteQuestion:', error);
            throw error;
        }
    }

    /**
     * Toggle question active status
     */
    async toggleQuestionStatus(questionId) {
        try {
            const question = await AdminQuestion.findById(questionId);

            if (!question) {
                throw new Error('Question not found');
            }

            await question.toggleActive();

            logger.info(`Toggled question ${questionId} to ${question.isActive ? 'active' : 'inactive'}`);
            return question;
        } catch (error) {
            logger.error('Error in toggleQuestionStatus:', error);
            throw error;
        }
    }

    /**
     * Get answers for a question
     */
    async getAnswersForQuestion(questionId) {
        try {
            const question = await AdminQuestion.findById(questionId);

            if (!question) {
                throw new Error('Question not found');
            }

            return {
                questionId: question._id,
                questionText: question.questionText,
                answers: question.answers
            };
        } catch (error) {
            logger.error('Error in getAnswersForQuestion:', error);
            throw error;
        }
    }

    /**
     * Increment question usage count
     */
    async incrementUsage(questionId) {
        try {
            const question = await AdminQuestion.findById(questionId);

            if (question) {
                await question.incrementUsage();
                logger.debug(`Incremented usage for question ${questionId}`);
            }
        } catch (error) {
            logger.error('Error in incrementUsage:', error);
            // Don't throw - this is not critical
        }
    }

    /**
     * Get popular questions
     */
    async getPopularQuestions(limit = 10) {
        try {
            const questions = await AdminQuestion.getPopularQuestions(limit);
            return questions;
        } catch (error) {
            logger.error('Error in getPopularQuestions:', error);
            throw error;
        }
    }

    /**
     * Get questions by category
     */
    async getQuestionsByCategory(category) {
        try {
            const questions = await AdminQuestion.find({
                category,
                isActive: true
            }).sort({ priority: -1 });

            return questions;
        } catch (error) {
            logger.error('Error in getQuestionsByCategory:', error);
            throw error;
        }
    }
}

module.exports = new QuestionService();
