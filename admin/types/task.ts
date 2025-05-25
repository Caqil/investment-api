
// src/types/task.ts
export type TaskType = 
  | 'follow'
  | 'like'
  | 'install';

export type Task = {
  id: number;
  name: string;
  description: string;
  task_type: TaskType;
  task_url?: string;
  is_mandatory: boolean;
  created_at: string;
  updated_at: string;
};

export type TaskResponse = {
  id: number;
  name: string;
  description: string;
  task_type: TaskType;
  task_url?: string;
  is_mandatory: boolean;
  is_completed: boolean;
};

export type UserTask = {
  id: number;
  user_id: number;
  task_id: number;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  task?: Task;
};
