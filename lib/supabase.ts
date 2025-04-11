export type UserSettings = {
  militaryTime: boolean;
  workType: 'full-time' | 'part-time';
  categories: string[];
};

export type DaySchedule = {
  start: string;
  end: string;
  isWorkingDay: boolean;
};

export type WorkingDays = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
          settings: UserSettings;
          working_days: WorkingDays;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
          settings?: UserSettings;
          working_days?: WorkingDays;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
          settings?: UserSettings;
          working_days?: WorkingDays;
        };
      };
    };
    Functions: {
      requesting_user_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
  };
};

