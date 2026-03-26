import { supabase } from './supabase';
import { StudentTask, TaskStatus } from '../types';

export const tasksService = {
  async getStudentTasks(studentId: string): Promise<StudentTask[]> {
    const { data, error } = await supabase
      .from('student_tasks')
      .select('*')
      .eq('student_id', studentId)
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    return data as StudentTask[];
  },

  async createTask(task: Partial<StudentTask>): Promise<StudentTask> {
    const { data, error } = await supabase
      .from('student_tasks')
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    return data as StudentTask;
  },

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    const { error } = await supabase
      .from('student_tasks')
      .update({ status })
      .eq('id', taskId);

    if (error) throw error;
  },

  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('student_tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  }
};
