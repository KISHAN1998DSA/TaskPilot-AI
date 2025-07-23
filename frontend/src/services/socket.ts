import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { addNotification } from '../store/slices/uiSlice';
import { fetchBoardById } from '../store/slices/boardSlice';
import { fetchTasks, setCurrentTask } from '../store/slices/taskSlice';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private currentBoardId: string | null = null;

  connect(token: string): void {
    if (this.socket && this.socket.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
    });

    this.setupListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentBoardId = null;
    }
  }

  joinBoard(boardId: string): void {
    if (!this.socket) {
      return;
    }

    // Leave previous board if any
    if (this.currentBoardId) {
      this.socket.emit('leave-board', this.currentBoardId);
    }

    this.socket.emit('join-board', boardId);
    this.currentBoardId = boardId;
  }

  leaveBoard(): void {
    if (!this.socket || !this.currentBoardId) {
      return;
    }

    this.socket.emit('leave-board', this.currentBoardId);
    this.currentBoardId = null;
  }

  private setupListeners(): void {
    if (!this.socket) {
      return;
    }

    // Board events
    this.socket.on('board:updated', (board) => {
      if (this.currentBoardId === board.id) {
        store.dispatch(fetchBoardById(board.id));
      }
    });

    this.socket.on('board:columnsUpdated', (board) => {
      if (this.currentBoardId === board.id) {
        store.dispatch(fetchBoardById(board.id));
      }
    });

    this.socket.on('board:memberAdded', (board) => {
      if (this.currentBoardId === board.id) {
        store.dispatch(fetchBoardById(board.id));
        store.dispatch(
          addNotification({
            message: 'A new member has been added to the board',
            type: 'info',
          })
        );
      }
    });

    this.socket.on('board:memberRemoved', ({ board, removedUserId }) => {
      if (this.currentBoardId === board.id) {
        store.dispatch(fetchBoardById(board.id));
        
        // Check if current user was removed
        const currentUserId = store.getState().auth.user?.id;
        if (currentUserId === removedUserId) {
          store.dispatch(
            addNotification({
              message: 'You have been removed from the board',
              type: 'warning',
            })
          );
        } else {
          store.dispatch(
            addNotification({
              message: 'A member has been removed from the board',
              type: 'info',
            })
          );
        }
      }
    });

    // Task events
    this.socket.on('task:created', ({ task, boardId }) => {
      if (this.currentBoardId === boardId) {
        store.dispatch(fetchTasks(boardId));
        store.dispatch(
          addNotification({
            message: 'A new task has been created',
            type: 'info',
          })
        );
      }
    });

    this.socket.on('task:updated', ({ task, boardId }) => {
      if (this.currentBoardId === boardId) {
        store.dispatch(fetchTasks(boardId));
        
        // Update current task if it's the one being viewed
        const currentTaskId = store.getState().tasks.currentTask?.id;
        if (currentTaskId === task.id) {
          store.dispatch(setCurrentTask(task));
        }
      }
    });

    this.socket.on('task:deleted', ({ taskId, boardId }) => {
      if (this.currentBoardId === boardId) {
        store.dispatch(fetchTasks(boardId));
        
        // Clear current task if it was deleted
        const currentTaskId = store.getState().tasks.currentTask?.id;
        if (currentTaskId === taskId) {
          store.dispatch({ type: 'tasks/clearCurrentTask' });
        }
        
        store.dispatch(
          addNotification({
            message: 'A task has been deleted',
            type: 'info',
          })
        );
      }
    });

    this.socket.on('task:moved', ({ boardId }) => {
      if (this.currentBoardId === boardId) {
        store.dispatch(fetchBoardById(boardId));
        store.dispatch(fetchTasks(boardId));
      }
    });

    this.socket.on('task:commentAdded', ({ taskId, userName }) => {
      const currentTaskId = store.getState().tasks.currentTask?.id;
      if (currentTaskId === taskId) {
        store.dispatch(
          addNotification({
            message: `${userName} added a comment`,
            type: 'info',
          })
        );
      }
    });

    // Connection events
    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      store.dispatch(
        addNotification({
          message: 'Connection error. Some features may be unavailable.',
          type: 'error',
        })
      );
    });
  }
}

export default new SocketService(); 