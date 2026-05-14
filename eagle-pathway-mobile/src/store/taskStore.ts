import { create } from 'zustand';
import { tasksService } from '../services/tasks';
import { StudentTask } from '../types';

interface TaskState {
  tasks: StudentTask[];
  isLoadingTasks: boolean;

  // Actions
  loadTasks: (userId: string) => Promise<void>;
  toggleTask: (taskId: string, currentStatus: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoadingTasks: false,

  loadTasks: async (userId) => {
    set({ isLoadingTasks: true });
    try {
      const tasks = await tasksService.getStudentTasks(userId);
      set({ tasks });
    } finally {
      set({ isLoadingTasks: false });
    }
  },

  toggleTask: async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await tasksService.updateTaskStatus(taskId, newStatus);
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, status: newStatus } : t
      ),
    }));
  },
}));
