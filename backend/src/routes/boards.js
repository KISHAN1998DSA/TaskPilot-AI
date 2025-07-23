const express = require('express');
const { body } = require('express-validator');
const boardController = require('../controllers/boardController');
const taskController = require('../controllers/taskController');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/boards
 * @desc    Create a new board
 * @access  Private
 */
router.post(
  '/',
  authenticateJWT,
  [
    body('name').notEmpty().withMessage('Board name is required'),
    body('description').optional(),
  ],
  boardController.createBoard
);

/**
 * @route   GET /api/boards
 * @desc    Get all boards for current user
 * @access  Private
 */
router.get('/', authenticateJWT, boardController.getBoards);

/**
 * @route   GET /api/boards/:id
 * @desc    Get board by ID
 * @access  Private
 */
router.get('/:id', authenticateJWT, boardController.getBoardById);

/**
 * @route   PUT /api/boards/:id
 * @desc    Update board
 * @access  Private
 */
router.put(
  '/:id',
  authenticateJWT,
  [
    body('name').optional().notEmpty().withMessage('Board name cannot be empty'),
    body('description').optional(),
  ],
  boardController.updateBoard
);

/**
 * @route   DELETE /api/boards/:id
 * @desc    Delete board
 * @access  Private
 */
router.delete('/:id', authenticateJWT, boardController.deleteBoard);

/**
 * @route   PUT /api/boards/:id/columns
 * @desc    Update board columns
 * @access  Private
 */
router.put(
  '/:id/columns',
  authenticateJWT,
  [body('columns').isArray().withMessage('Columns must be an array')],
  boardController.updateColumns
);

/**
 * @route   POST /api/boards/:id/members
 * @desc    Add member to board
 * @access  Private
 */
router.post(
  '/:id/members',
  authenticateJWT,
  [body('userId').notEmpty().withMessage('User ID is required')],
  boardController.addMember
);

/**
 * @route   DELETE /api/boards/:id/members/:userId
 * @desc    Remove member from board
 * @access  Private
 */
router.delete('/:id/members/:userId', authenticateJWT, boardController.removeMember);

// Task routes

/**
 * @route   POST /api/boards/:boardId/tasks
 * @desc    Create a new task
 * @access  Private
 */
router.post(
  '/:boardId/tasks',
  authenticateJWT,
  [
    body('title').notEmpty().withMessage('Task title is required'),
    body('description').optional(),
    body('assigneeId').optional(),
    body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
    body('status').optional(),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('columnId').notEmpty().withMessage('Column ID is required'),
    body('subtasks').optional().isArray().withMessage('Subtasks must be an array'),
  ],
  taskController.createTask
);

/**
 * @route   GET /api/boards/:boardId/tasks
 * @desc    Get all tasks for a board
 * @access  Private
 */
router.get('/:boardId/tasks', authenticateJWT, taskController.getTasks);

/**
 * @route   GET /api/boards/:boardId/tasks/:id
 * @desc    Get task by ID
 * @access  Private
 */
router.get('/:boardId/tasks/:id', authenticateJWT, taskController.getTaskById);

/**
 * @route   PUT /api/boards/:boardId/tasks/:id
 * @desc    Update task
 * @access  Private
 */
router.put(
  '/:boardId/tasks/:id',
  authenticateJWT,
  [
    body('title').optional().notEmpty().withMessage('Task title cannot be empty'),
    body('description').optional(),
    body('assigneeId').optional(),
    body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
    body('status').optional(),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('subtasks').optional().isArray().withMessage('Subtasks must be an array'),
  ],
  taskController.updateTask
);

/**
 * @route   DELETE /api/boards/:boardId/tasks/:id
 * @desc    Delete task
 * @access  Private
 */
router.delete('/:boardId/tasks/:id', authenticateJWT, taskController.deleteTask);

/**
 * @route   PUT /api/boards/:boardId/tasks/:id/move
 * @desc    Move task between columns
 * @access  Private
 */
router.put(
  '/:boardId/tasks/:id/move',
  authenticateJWT,
  [
    body('sourceColumnId').notEmpty().withMessage('Source column ID is required'),
    body('destinationColumnId').notEmpty().withMessage('Destination column ID is required'),
    body('newIndex').isNumeric().withMessage('New index must be a number'),
  ],
  taskController.moveTask
);

/**
 * @route   POST /api/boards/:boardId/tasks/:id/comments
 * @desc    Add comment to task
 * @access  Private
 */
router.post(
  '/:boardId/tasks/:id/comments',
  authenticateJWT,
  [body('text').notEmpty().withMessage('Comment text is required')],
  taskController.addComment
);

module.exports = router; 