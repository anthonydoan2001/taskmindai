import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single supabase client for interacting with your database
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = (clerkToken?: string | null) => {
  if (!supabaseInstance || clerkToken) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false, // Disable session persistence since we're using Clerk
      },
      global: {
        headers: {
          Authorization: clerkToken ? `Bearer ${clerkToken}` : '',
        },
      },
    });
  }
  return supabaseInstance;
};

// Export default instance for convenience
export const supabase = getSupabaseClient();

// Types
export type WorkingDay = {
  dayOfWeek: string; // 0-6 for Sunday-Saturday
  startTime: string; // 24-hour format HH:mm
  endTime: string; // 24-hour format HH:mm
  isWorkingDay: boolean;
};

export type UserSettings = {
  militaryTime: boolean;
  workType: 'full-time' | 'part-time';
  categories: string[];
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
