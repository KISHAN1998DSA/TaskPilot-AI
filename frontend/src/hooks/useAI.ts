import { useState } from 'react';
import api from '../services/api';
import type { Subtask } from '../store/slices/taskSlice';
import { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
}

interface UseAIReturn {
  loading: boolean;
  error: string | null;
  generateSubtasks: (taskDescription: string) => Promise<Subtask[]>;
  analyzePriority: (taskDescription: string, dueDate?: string) => Promise<string>;
  parseTaskFromText: (text: string) => Promise<{
    title: string;
    description: string;
    dueDate: string | null;
    priority: 'Low' | 'Medium' | 'High';
  }>;
}

export const useAI = (): UseAIReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSubtasks = async (taskDescription: string): Promise<Subtask[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/ai/generate-subtasks', { taskDescription });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to generate subtasks';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const analyzePriority = async (taskDescription: string, dueDate?: string): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/ai/analyze-priority', { taskDescription, dueDate });
      return response.data.priority;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to analyze priority';
      setError(errorMessage);
      return 'Medium';
    } finally {
      setLoading(false);
    }
  };

  const parseTaskFromText = async (text: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/ai/parse-task', { text });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ErrorResponse>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to parse task from text';
      setError(errorMessage);
      return {
        title: '',
        description: '',
        dueDate: null,
        priority: 'Medium' as const,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    generateSubtasks,
    analyzePriority,
    parseTaskFromText,
  };
}; 