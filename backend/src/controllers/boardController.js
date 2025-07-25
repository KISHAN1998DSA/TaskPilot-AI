const { validationResult } = require('express-validator');
const db = require('../models');
const Board = db.Board;
const User = db.User;

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
      userId: req.user.id,
    });

    // Add creator as a member
    await board.addMember(req.user.id);

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
    const ownedBoards = await Board.findAll({
      where: { userId: req.user.id },
      order: [['updatedAt', 'DESC']]
    });
    
    // Get boards where user is a member
    const memberBoards = await req.user.getMemberBoards({
      order: [['updatedAt', 'DESC']]
    });
    
    // Combine both sets of boards
    const boards = [...ownedBoards, ...memberBoards];
    
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
    const board = await Board.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email', 'avatar'],
          through: { attributes: [] }
        }
      ]
    });

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is a member or creator
    const isMember = await board.hasUser(req.user.id);
    if (!isMember && board.userId !== req.user.id && req.user.role !== 'admin') {
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

    const board = await Board.findByPk(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is the creator or admin
    if (board.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this board' });
    }

    // Update board fields
    if (name) board.name = name;
    if (description !== undefined) board.description = description;
    
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
    const board = await Board.findByPk(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is the creator or admin
    if (board.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this board' });
    }

    // Delete the board (Sequelize cascade will handle associated records)
    await board.destroy();

    // Notify connected clients about the deleted board
    req.io.emit('board:deleted', req.params.id);

    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update column order
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

    const board = await Board.findByPk(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is a member or creator
    const isMember = await board.hasUser(req.user.id);
    if (!isMember && board.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this board' });
    }

    // Update columns in the database
    // This will depend on how columns are stored in your database
    // For example, if columns are stored in a separate table:
    // await db.Column.bulkCreate(columns.map(col => ({ ...col, boardId: board.id })), 
    //   { updateOnDuplicate: ['order', 'name'] });
    
    // If columns are stored as JSON in the board table:
    board.columns = columns;
    await board.save();

    // Notify connected clients about the updated columns
    req.io.to(req.params.id).emit('board:columnsUpdated', { boardId: req.params.id, columns });

    res.json({ message: 'Columns updated successfully', columns });
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

    const board = await Board.findByPk(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is the creator or admin
    if (board.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to add members to this board' });
    }

    // Check if user is already a member
    if (await board.hasUser(userId)) {
      return res.status(400).json({ message: 'User is already a member of this board' });
    }

    // Add user as member
    await board.addUser(userId);
    
    // Reload board with members
    const updatedBoard = await Board.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'members',
        attributes: ['id', 'name', 'email', 'avatar'],
        through: { attributes: [] }
      }]
    });

    // Notify connected clients about the updated members
    req.io.to(req.params.id).emit('board:memberAdded', { 
      boardId: req.params.id, 
      members: updatedBoard.members 
    });

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
    const board = await Board.findByPk(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is the creator or admin
    if (board.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to remove members from this board' });
    }

    // Cannot remove the creator
    if (board.userId === req.params.userId) {
      return res.status(400).json({ message: 'Cannot remove the board creator' });
    }

    // Check if user is a member
    if (!(await board.hasUser(req.params.userId))) {
      return res.status(400).json({ message: 'User is not a member of this board' });
    }

    // Remove user from members
    await board.removeUser(req.params.userId);
    
    // Reload board with members
    const updatedBoard = await Board.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'members',
        attributes: ['id', 'name', 'email', 'avatar'],
        through: { attributes: [] }
      }]
    });

    // Notify connected clients about the removed member
    req.io.to(req.params.id).emit('board:memberRemoved', { 
      boardId: req.params.id, 
      userId: req.params.userId,
      members: updatedBoard.members
    });

    res.json(updatedBoard);
  } catch (error) {
    next(error);
  }
}; 