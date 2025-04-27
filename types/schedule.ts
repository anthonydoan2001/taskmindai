export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface WorkSchedule {
  id: string;
  user_id: string;
  day: DayOfWeek;
  start_time: string; // HH:mm format
  end_time: string; // HH:mm format
  is_active: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export type WorkScheduleInput = Omit<WorkSchedule, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export interface DisplaySettings {
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
} 