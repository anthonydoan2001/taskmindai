export type UserSettings = {
  militaryTime: boolean;
  workType: 'full-time' | 'part-time';
  categories: string[];
};

export type WorkingDay = {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
};

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          clerk_id: string;
          created_at: string;
          updated_at: string;
          settings: UserSettings;
          working_days: WorkingDay[];
        };
        Insert: {
          id?: string;
          clerk_id: string;
          created_at?: string;
          updated_at?: string;
          settings?: UserSettings;
          working_days?: WorkingDay[];
        };
        Update: {
          id?: string;
          clerk_id?: string;
          created_at?: string;
          updated_at?: string;
          settings?: UserSettings;
          working_days?: WorkingDay[];
        };
      };
    };
    Functions: Record<string, never>;
  };
};
