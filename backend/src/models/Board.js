const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Column name is required'],
      trim: true,
    },
    taskIds: {
      type: [String],
      default: [],
    },
  },
  { _id: true, id: true }
);

const boardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Board name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    columns: {
      type: [columnSchema],
      default: [
        { name: 'To Do', taskIds: [] },
        { name: 'In Progress', taskIds: [] },
        { name: 'Done', taskIds: [] },
      ],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for tasks
boardSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'boardId',
});

const Board = mongoose.model('Board', boardSchema);

module.exports = Board; 