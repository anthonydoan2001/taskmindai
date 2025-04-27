export interface Task {
  id: string;
  title: string;
  description: string;
  start_date: Date;
  end_date: Date;
  is_all_day: boolean;
  priority: 'low' | 'medium' | 'high';
  category: 'work' | 'personal' | 'study' | 'other';
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export type TaskFormData = Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export type TaskCreateInput = Omit<Task, 'id' | 'created_at' | 'updated_at'>; 