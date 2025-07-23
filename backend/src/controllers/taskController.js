const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Board = require('../models/Board');

/**
 * @desc    Create a new task
 * @route   POST /api/boards/:boardId/tasks
 * @access  Private
 */
exports.createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const { title, description, assigneeId, priority, dueDate, status, tags, columnId, subtasks } = req.body;

    // Check if board exists
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is a member or creator of the board
    if (
      !board.members.some((member) => member.toString() === req.user._id.toString()) &&
      board.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to add tasks to this board' });
    }

    // Check if column exists
    const columnExists = board.columns.some((column) => column.id === columnId);
    if (!columnExists) {
      return res.status(404).json({ message: 'Column not found in this board' });
    }

    const task = await Task.create({
      title,
      description,
      assigneeId,
      priority,
      dueDate,
      status: status || board.columns.find((column) => column.id === columnId)?.name || 'To Do',
      tags,
      boardId: req.params.boardId,
      columnId,
      createdBy: req.user._id,
      subtasks: subtasks || [],
    });

    // Add task ID to column's taskIds array
    const columnIndex = board.columns.findIndex((column) => column.id === columnId);
    if (columnIndex !== -1) {
      board.columns[columnIndex].taskIds.push(task._id.toString());
      await board.save();
    }

    // Notify connected clients about the new task
    req.io.to(req.params.boardId).emit('task:created', { task, boardId: req.params.boardId });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all tasks for a board
 * @route   GET /api/boards/:boardId/tasks
 * @access  Private
 */
exports.getTasks = async (req, res, next) => {
  try {
    // Check if board exists and user has access
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is a member or creator of the board
    if (
      !board.members.some((member) => member.toString() === req.user._id.toString()) &&
      board.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to view tasks in this board' });
    }

    const tasks = await Task.find({ boardId: req.params.boardId })
      .populate('assigneeId', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ updatedAt: -1 });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get task by ID
 * @route   GET /api/boards/:boardId/tasks/:id
 * @access  Private
 */
exports.getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assigneeId', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task belongs to the specified board
    if (task.boardId.toString() !== req.params.boardId) {
      return res.status(400).json({ message: 'Task does not belong to this board' });
    }

    // Check if user has access to the board
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is a member or creator of the board
    if (
      !board.members.some((member) => member.toString() === req.user._id.toString()) &&
      board.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to view this task' });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task
 * @route   PUT /api/boards/:boardId/tasks/:id
 * @access  Private
 */
exports.updateTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const { title, description, assigneeId, priority, dueDate, status, tags, subtasks } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task belongs to the specified board
    if (task.boardId.toString() !== req.params.boardId) {
      return res.status(400).json({ message: 'Task does not belong to this board' });
    }

    // Check if user has access to the board
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is a member or creator of the board
    if (
      !board.members.some((member) => member.toString() === req.user._id.toString()) &&
      board.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    // Update task fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assigneeId !== undefined) task.assigneeId = assigneeId;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (status !== undefined) task.status = status;
    if (tags !== undefined) task.tags = tags;
    if (subtasks !== undefined) task.subtasks = subtasks;

    const updatedTask = await task.save();

    // Populate for response
    await updatedTask.populate('assigneeId', 'name email avatar');
    await updatedTask.populate('createdBy', 'name email avatar');

    // Notify connected clients about the updated task
    req.io.to(req.params.boardId).emit('task:updated', { task: updatedTask, boardId: req.params.boardId });

    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/boards/:boardId/tasks/:id
 * @access  Private
 */
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task belongs to the specified board
    if (task.boardId.toString() !== req.params.boardId) {
      return res.status(400).json({ message: 'Task does not belong to this board' });
    }

    // Check if user has access to the board
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is a member or creator of the board
    if (
      !board.members.some((member) => member.toString() === req.user._id.toString()) &&
      board.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    // Remove task ID from column's taskIds array
    const columnIndex = board.columns.findIndex((column) => column.id === task.columnId);
    if (columnIndex !== -1) {
      board.columns[columnIndex].taskIds = board.columns[columnIndex].taskIds.filter(
        (id) => id !== task._id.toString()
      );
      await board.save();
    }

    await task.deleteOne();

    // Notify connected clients about the deleted task
    req.io.to(req.params.boardId).emit('task:deleted', {
      taskId: req.params.id,
      boardId: req.params.boardId,
      columnId: task.columnId,
    });

    res.json({ message: 'Task removed' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Move task between columns
 * @route   PUT /api/boards/:boardId/tasks/:id/move
 * @access  Private
 */
exports.moveTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const { sourceColumnId, destinationColumnId, newIndex } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task belongs to the specified board
    if (task.boardId.toString() !== req.params.boardId) {
      return res.status(400).json({ message: 'Task does not belong to this board' });
    }

    // Check if user has access to the board
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is a member or creator of the board
    if (
      !board.members.some((member) => member.toString() === req.user._id.toString()) &&
      board.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to move tasks in this board' });
    }

    // Check if source and destination columns exist
    const sourceColumnIndex = board.columns.findIndex((column) => column.id === sourceColumnId);
    const destColumnIndex = board.columns.findIndex((column) => column.id === destinationColumnId);

    if (sourceColumnIndex === -1 || destColumnIndex === -1) {
      return res.status(404).json({ message: 'Source or destination column not found' });
    }

    // Remove task from source column
    board.columns[sourceColumnIndex].taskIds = board.columns[sourceColumnIndex].taskIds.filter(
      (id) => id !== task._id.toString()
    );

    // Add task to destination column at the specified index
    board.columns[destColumnIndex].taskIds.splice(newIndex, 0, task._id.toString());

    // Update task's columnId and status
    task.columnId = destinationColumnId;
    task.status = board.columns[destColumnIndex].name;

    // Save changes
    await board.save();
    await task.save();

    // Notify connected clients about the moved task
    req.io.to(req.params.boardId).emit('task:moved', {
      task,
      boardId: req.params.boardId,
      sourceColumnId,
      destinationColumnId,
      board,
    });

    res.json({ task, board });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add comment to task
 * @route   POST /api/boards/:boardId/tasks/:id/comments
 * @access  Private
 */
exports.addComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const { text } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task belongs to the specified board
    if (task.boardId.toString() !== req.params.boardId) {
      return res.status(400).json({ message: 'Task does not belong to this board' });
    }

    // Check if user has access to the board
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check if user is a member or creator of the board
    if (
      !board.members.some((member) => member.toString() === req.user._id.toString()) &&
      board.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to comment on this task' });
    }

    const comment = {
      text,
      userId: req.user._id,
      createdAt: new Date(),
    };

    task.comments.push(comment);
    await task.save();

    // Get the newly added comment (the last one)
    const newComment = task.comments[task.comments.length - 1];

    // Notify connected clients about the new comment
    req.io.to(req.params.boardId).emit('task:commentAdded', {
      taskId: task._id,
      comment: newComment,
      userId: req.user._id,
      userName: req.user.name,
    });

    res.status(201).json(newComment);
  } catch (error) {
    next(error);
  }
}; 