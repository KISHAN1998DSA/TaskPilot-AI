const express = require('express');
const { body } = require('express-validator');
const aiController = require('../controllers/aiController');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/ai/generate-subtasks
 * @desc    Generate subtasks from task description
 * @access  Private
 */
router.post(
  '/generate-subtasks',
  authenticateJWT,
  [body('taskDescription').notEmpty().withMessage('Task description is required')],
  aiController.generateSubtasks
);

/**
 * @route   POST /api/ai/analyze-priority
 * @desc    Analyze task priority based on description and due date
 * @access  Private
 */
router.post(
  '/analyze-priority',
  authenticateJWT,
  [
    body('taskDescription').notEmpty().withMessage('Task description is required'),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  ],
  aiController.analyzePriority
);

/**
 * @route   POST /api/ai/parse-task
 * @desc    Parse natural language input to create task
 * @access  Private
 */
router.post(
  '/parse-task',
  authenticateJWT,
  [body('text').notEmpty().withMessage('Text input is required')],
  aiController.parseTaskFromText
);

module.exports = router; 