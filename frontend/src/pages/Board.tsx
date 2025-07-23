import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import type { DropResult } from 'react-beautiful-dnd';
import type { RootState, AppDispatch } from '../store';
import { fetchBoardById, updateColumnOrder } from '../store/slices/boardSlice';
import { fetchTasks, moveTask, setCurrentTask } from '../store/slices/taskSlice';
import { openModal } from '../store/slices/uiSlice';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { Column } from '../store/slices/boardSlice';
import type { Task } from '../store/slices/taskSlice';

const Board = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const { currentBoard, isLoading: isBoardLoading, error: boardError } = useSelector(
    (state: RootState) => state.boards
  );
  const { tasks, isLoading: areTasksLoading } = useSelector((state: RootState) => state.tasks);
  const dispatch = useDispatch<AppDispatch>();
  const [columns, setColumns] = useState<Column[]>([]);

  useEffect(() => {
    if (boardId) {
      dispatch(fetchBoardById(boardId));
      dispatch(fetchTasks(boardId));
    }
  }, [dispatch, boardId]);

  useEffect(() => {
    if (currentBoard) {
      setColumns(currentBoard.columns);
    }
  }, [currentBoard]);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, type, draggableId } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // No movement
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Column reordering
    if (type === 'column') {
      const newColumns = Array.from(columns);
      const [removed] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, removed);

      setColumns(newColumns);
      if (boardId) {
        dispatch(updateColumnOrder({ boardId, columns: newColumns }));
      }
      return;
    }

    // Task movement
    const sourceColumn = columns.find((col) => col.id === source.droppableId);
    const destColumn = columns.find((col) => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn || !boardId) return;

    // Moving within the same column
    if (source.droppableId === destination.droppableId) {
      const newTaskIds = Array.from(sourceColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...sourceColumn,
        taskIds: newTaskIds,
      };

      const newColumns = columns.map((col) =>
        col.id === newColumn.id ? newColumn : col
      );

      setColumns(newColumns);
      dispatch(
        moveTask({
          boardId,
          taskId: draggableId,
          sourceColumnId: source.droppableId,
          destinationColumnId: destination.droppableId,
          newIndex: destination.index,
        })
      );
      return;
    }

    // Moving to another column
    const sourceTaskIds = Array.from(sourceColumn.taskIds);
    sourceTaskIds.splice(source.index, 1);
    const newSourceColumn = {
      ...sourceColumn,
      taskIds: sourceTaskIds,
    };

    const destTaskIds = Array.from(destColumn.taskIds);
    destTaskIds.splice(destination.index, 0, draggableId);
    const newDestColumn = {
      ...destColumn,
      taskIds: destTaskIds,
    };

    const newColumns = columns.map((col) => {
      if (col.id === newSourceColumn.id) return newSourceColumn;
      if (col.id === newDestColumn.id) return newDestColumn;
      return col;
    });

    setColumns(newColumns);
    dispatch(
      moveTask({
        boardId,
        taskId: draggableId,
        sourceColumnId: source.droppableId,
        destinationColumnId: destination.droppableId,
        newIndex: destination.index,
      })
    );
  };

  const handleAddTask = (columnId: string) => {
    dispatch(
      openModal({
        modal: 'createTask',
        data: { boardId, columnId },
      })
    );
  };

  const handleEditTask = (task: Task) => {
    dispatch(setCurrentTask(task));
    dispatch(
      openModal({
        modal: 'editTask',
        data: { task },
      })
    );
  };

  if (isBoardLoading || areTasksLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (boardError || !currentBoard) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-destructive">{boardError || 'Board not found'}</p>
          <button
            onClick={() => boardId && dispatch(fetchBoardById(boardId))}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">{currentBoard.name}</h1>
          {currentBoard.description && (
            <p className="mt-1 text-muted-foreground">{currentBoard.description}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => dispatch(openModal({ modal: 'boardSettings', data: { board: currentBoard } }))}
            className="rounded-md bg-accent p-2 text-accent-foreground hover:bg-accent/80"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
          <button
            onClick={() => dispatch(openModal({ modal: 'createColumn', data: { boardId } }))}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Add Column
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board" type="column" direction="horizontal">
          {(provided) => (
            <div
              className="flex h-full space-x-4 overflow-x-auto pb-4"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {columns.map((column, index) => (
                <Draggable key={column.id} draggableId={column.id} index={index}>
                  {(provided) => (
                    <div
                      className="flex h-full w-72 flex-shrink-0 flex-col rounded-lg border border-border bg-card"
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <div
                        className="flex items-center justify-between border-b border-border p-3"
                        {...provided.dragHandleProps}
                      >
                        <h3 className="font-medium text-foreground">{column.name}</h3>
                        <div className="flex items-center">
                          <span className="mr-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {column.taskIds.length}
                          </span>
                          <button
                            onClick={() => dispatch(openModal({ modal: 'editColumn', data: { column, boardId } }))}
                            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <Droppable droppableId={column.id} type="task">
                        {(provided, snapshot) => (
                          <div
                            className={`flex flex-1 flex-col overflow-y-auto p-2 ${
                              snapshot.isDraggingOver ? 'bg-accent/50' : ''
                            }`}
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            {column.taskIds.map((taskId, index) => {
                              const task = tasks.find((t) => t.id === taskId);
                              if (!task) return null;
                              
                              return (
                                <Draggable key={taskId} draggableId={taskId} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      className={`mb-2 rounded-md border border-border bg-background p-3 shadow-sm ${
                                        snapshot.isDragging ? 'shadow-md' : ''
                                      }`}
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      onClick={() => handleEditTask(task)}
                                    >
                                      <h4 className="mb-2 font-medium text-foreground">{task.title}</h4>
                                      {task.description && (
                                        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                                          {task.description}
                                        </p>
                                      )}
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                          {task.priority && (
                                            <span
                                              className={`mr-2 rounded-full px-2 py-0.5 text-xs ${
                                                task.priority === 'High'
                                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                  : task.priority === 'Medium'
                                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                              }`}
                                            >
                                              {task.priority}
                                            </span>
                                          )}
                                          {task.dueDate && (
                                            <span className="text-xs text-muted-foreground">
                                              {new Date(task.dueDate).toLocaleDateString()}
                                            </span>
                                          )}
                                        </div>
                                        {task.assigneeId && (
                                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                            A
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                      <div className="border-t border-border p-2">
                        <button
                          onClick={() => handleAddTask(column.id)}
                          className="flex w-full items-center justify-center rounded-md p-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="mr-1 h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          Add Task
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {columns.length === 0 && (
                <div className="flex h-64 w-full items-center justify-center rounded-lg border border-border bg-card">
                  <div className="text-center">
                    <p className="mb-4 text-muted-foreground">No columns in this board yet.</p>
                    <button
                      onClick={() => dispatch(openModal({ modal: 'createColumn', data: { boardId } }))}
                      className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                    >
                      Add Your First Column
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default Board; 