const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticateJWT, isAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private/Admin
 */
router.get('/', authenticateJWT, isAdmin, userController.getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', authenticateJWT, userController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private
 */
router.put(
  '/:id',
  authenticateJWT,
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please include a valid email'),
    body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
    body('role').optional().isIn(['Admin', 'Member']).withMessage('Invalid role'),
  ],
  userController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private/Admin
 */
router.delete('/:id', authenticateJWT, userController.deleteUser);

module.exports = router; 