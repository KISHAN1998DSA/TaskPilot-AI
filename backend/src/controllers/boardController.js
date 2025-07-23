const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Board = require('../models/Board');
const Task = require('../models/Task');

/**
 * @desc    Create a new board
 * @route   POST /api/boards
 * @access  Private
 */
exports.createBoard = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const { name, description } = req.body;

    const board = await Board.create({
      name,
      description,
      createdBy: req.user._id,
      members: [req.user._id], // Creator is automatically a member
    });

    // Notify connected clients about the new board
    req.io.emit('board:created', board);

    res.status(201).json(board);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all boards for the current user
 * @route   GET /api/boards
 * @access  Private
 */
exports.getBoards = async (req, res, next) => {
  try {
    // Get boards where user is creator or member
    const boards = await Board.find({
      $or: [{ createdBy: req.user._id }, { members: req.user._id }],
    }).sort({ updatedAt: -1 });

    res.json(boards);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get board by ID
 * @route   GET /api/boards/:id
 * @access  Private
 */
exports.getBoardById = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('members', 'name email avatar');

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is a member or creator
    if (
      !board.members.some((member) => member._id.toString() === req.user._id.toString()) &&
      board.createdBy._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to access this board' });
    }

    res.json(board);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update board
 * @route   PUT /api/boards/:id
 * @access  Private
 */
exports.updateBoard = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const { name, description } = req.body;

    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is the creator or admin
    if (
      board.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to update this board' });
    }

    board.name = name || board.name;
    board.description = description !== undefined ? description : board.description;

    const updatedBoard = await board.save();

    // Notify connected clients about the updated board
    req.io.to(req.params.id).emit('board:updated', updatedBoard);

    res.json(updatedBoard);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete board
 * @route   DELETE /api/boards/:id
 * @access  Private
 */
exports.deleteBoard = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is the creator or admin
    if (
      board.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to delete this board' });
    }

    // Delete all tasks associated with this board
    await Task.deleteMany({ boardId: board._id });

    // Delete the board
    await board.deleteOne();

    // Notify connected clients about the deleted board
    req.io.emit('board:deleted', req.params.id);

    res.json({ message: 'Board removed' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update board columns
 * @route   PUT /api/boards/:id/columns
 * @access  Private
 */
exports.updateColumns = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const { columns } = req.body;

    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is a member or creator
    if (
      !board.members.some((member) => member.toString() === req.user._id.toString()) &&
      board.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to update this board' });
    }

    board.columns = columns;
    const updatedBoard = await board.save();

    // Notify connected clients about the updated columns
    req.io.to(req.params.id).emit('board:columnsUpdated', updatedBoard);

    res.json(updatedBoard);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add member to board
 * @route   POST /api/boards/:id/members
 * @access  Private
 */
exports.addMember = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const { userId } = req.body;

    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is the creator or admin
    if (
      board.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to add members to this board' });
    }

    // Check if user is already a member
    if (board.members.includes(userId)) {
      return res.status(400).json({ message: 'User is already a member of this board' });
    }

    board.members.push(userId);
    const updatedBoard = await board.save();

    // Populate members for response
    await updatedBoard.populate('members', 'name email avatar');

    // Notify connected clients about the updated members
    req.io.to(req.params.id).emit('board:memberAdded', updatedBoard);

    res.json(updatedBoard);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove member from board
 * @route   DELETE /api/boards/:id/members/:userId
 * @access  Private
 */
exports.removeMember = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is the creator or admin
    if (
      board.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to remove members from this board' });
    }

    // Cannot remove the creator
    if (board.createdBy.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Cannot remove the board creator' });
    }

    // Check if user is a member
    if (!board.members.includes(req.params.userId)) {
      return res.status(400).json({ message: 'User is not a member of this board' });
    }

    board.members = board.members.filter(
      (member) => member.toString() !== req.params.userId
    );
    
    const updatedBoard = await board.save();

    // Populate members for response
    await updatedBoard.populate('members', 'name email avatar');

    // Notify connected clients about the removed member
    req.io.to(req.params.id).emit('board:memberRemoved', {
      board: updatedBoard,
      removedUserId: req.params.userId,
    });

    res.json(updatedBoard);
  } catch (error) {
    next(error);
  }
}; 