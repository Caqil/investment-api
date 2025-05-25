export enum TaskType {
    FOLLOW = "follow",
    LIKE = "like",
    INSTALL = "install"
  }
  
  export interface Task {
    id: number;
    name: string;
    description: string;
    task_type: TaskType;
    task_url?: string;
    is_mandatory: boolean;
    is_completed: boolean;
  }