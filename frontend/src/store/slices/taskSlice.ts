import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import api from '../../services/api';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId?: string;
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: string;
  status: string;
  tags: string[];
  boardId: string;
  columnId: string;
  createdBy: string;
  subtasks: Subtask[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  text: string;
  userId: string;
  createdAt: string;
}

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;
}

interface ErrorResponse {
  message: string;
}

const initialState: TaskState = {
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (boardId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/boards/${boardId}/tasks`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch tasks');
    }
  }
);

export const fetchTaskById = createAsyncThunk(
  'tasks/fetchTaskById',
  async ({ boardId, taskId }: { boardId: string; taskId: string }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/boards/${boardId}/tasks/${taskId}`);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch task');
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (
    { boardId, taskData }: { boardId: string; taskData: Partial<Task> },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post(`/boards/${boardId}/tasks`, taskData);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to create task');
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async (
    { boardId, taskId, taskData }: { boardId: string; taskId: string; taskData: Partial<Task> },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put(`/boards/${boardId}/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to update task');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async ({ boardId, taskId }: { boardId: string; taskId: string }, { rejectWithValue }) => {
    try {
      await api.delete(`/boards/${boardId}/tasks/${taskId}`);
      return taskId;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to delete task');
    }
  }
);

export const moveTask = createAsyncThunk(
  'tasks/moveTask',
  async (
    {
      boardId,
      taskId,
      sourceColumnId,
      destinationColumnId,
      newIndex,
    }: {
      boardId: string;
      taskId: string;
      sourceColumnId: string;
      destinationColumnId: string;
      newIndex: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put(`/boards/${boardId}/tasks/${taskId}/move`, {
        sourceColumnId,
        destinationColumnId,
        newIndex,
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to move task');
    }
  }
);

export const addComment = createAsyncThunk(
  'tasks/addComment',
  async (
    { boardId, taskId, text }: { boardId: string; taskId: string; text: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post(`/boards/${boardId}/tasks/${taskId}/comments`, { text });
      return { taskId, comment: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to add comment');
    }
  }
);

export const generateSubtasks = createAsyncThunk(
  'tasks/generateSubtasks',
  async (
    { taskDescription, apiKey }: { taskDescription: string; apiKey: string },
    { rejectWithValue }
  ) => {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `Based on the following task description, generate a list of 3-5 subtasks that would help complete this task. Return ONLY a JSON array of objects with 'title' and 'completed' properties. Example: [{"title": "First subtask", "completed": false}, {"title": "Second subtask", "completed": false}]. Task description: ${taskDescription}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON array from response
      const jsonMatch = text.match(/\[.*\]/s);
      if (!jsonMatch) {
        return rejectWithValue('Failed to generate valid subtasks');
      }
      
      const subtasks = JSON.parse(jsonMatch[0]);
      return subtasks;
    } catch {
      return rejectWithValue('Failed to generate subtasks');
    }
  }
);

export const analyzePriority = createAsyncThunk(
  'tasks/analyzePriority',
  async (
    { taskDescription, dueDate, apiKey }: { taskDescription: string; dueDate?: string; apiKey: string },
    { rejectWithValue }
  ) => {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `Based on the following task description and due date, determine the appropriate priority level (Low, Medium, or High). Return ONLY the priority level as a single word. Task description: ${taskDescription}. Due date: ${dueDate || 'Not specified'}.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      // Normalize the response
      if (text.toLowerCase().includes('high')) {
        return 'High';
      } else if (text.toLowerCase().includes('medium')) {
        return 'Medium';
      } else {
        return 'Low';
      }
    } catch {
      return rejectWithValue('Failed to analyze priority');
    }
  }
);

export const createTaskFromText = createAsyncThunk(
  'tasks/createTaskFromText',
  async (
    { text, boardId, columnId, apiKey }: { text: string; boardId: string; columnId: string; apiKey: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `Parse the following natural language input and extract task details. Return ONLY a JSON object with these properties: title, description, dueDate (YYYY-MM-DD format if present, null if not), priority (Low, Medium, High). Input: "${text}"`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      // Extract JSON object from response
      const jsonMatch = responseText.match(/\{.*\}/s);
      if (!jsonMatch) {
        return rejectWithValue('Failed to parse task from text');
      }
      
      const taskData = JSON.parse(jsonMatch[0]);
      
      // Create the task with the extracted data
      const newTaskData = {
        ...taskData,
        boardId,
        columnId,
        status: 'To Do',
        tags: [],
      };
      
      const createdTask = await dispatch(createTask({ boardId, taskData: newTaskData })).unwrap();
      return createdTask;
    } catch {
      return rejectWithValue('Failed to create task from text');
    }
  }
);

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearTaskError: (state) => {
      state.error = null;
    },
    setCurrentTask: (state, action: PayloadAction<Task>) => {
      state.currentTask = action.payload;
    },
    clearCurrentTask: (state) => {
      state.currentTask = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tasks
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
        state.isLoading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Task by ID
      .addCase(fetchTaskById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTaskById.fulfilled, (state, action: PayloadAction<Task>) => {
        state.isLoading = false;
        state.currentTask = action.payload;
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Task
      .addCase(createTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action: PayloadAction<Task>) => {
        state.isLoading = false;
        state.tasks.push(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Task
      .addCase(updateTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action: PayloadAction<Task>) => {
        state.isLoading = false;
        const index = state.tasks.findIndex((task) => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        if (state.currentTask?.id === action.payload.id) {
          state.currentTask = action.payload;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete Task
      .addCase(deleteTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.tasks = state.tasks.filter((task) => task.id !== action.payload);
        if (state.currentTask?.id === action.payload) {
          state.currentTask = null;
        }
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Add Comment
      .addCase(addComment.fulfilled, (state, action) => {
        const { taskId, comment } = action.payload;
        const taskIndex = state.tasks.findIndex((task) => task.id === taskId);
        if (taskIndex !== -1) {
          state.tasks[taskIndex].comments.push(comment);
        }
        if (state.currentTask?.id === taskId) {
          state.currentTask.comments.push(comment);
        }
      });
  },
});

export const { clearTaskError, setCurrentTask, clearCurrentTask } = taskSlice.actions;
export default taskSlice.reducer; 