import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false // Disable session persistence since we're using Clerk
  },
  global: {
    // Set Supabase to use the current user's ID as the authenticated user
    headers: {
      Authorization: ''  // Will be overridden by middleware
    }
  }
})

// Helper to get Supabase instance with auth header
export const getAuthenticatedSupabaseClient = (clerkToken?: string | null) => {
  if (!clerkToken) return supabase

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${clerkToken}`
      }
    }
  })
}

export type WorkingDay = {
  dayOfWeek: string // 0-6 for Sunday-Saturday
  startTime: string // 24-hour format HH:mm
  endTime: string // 24-hour format HH:mm
  isWorkingDay: boolean
}

export type UserSettings = {
  militaryTime: boolean
  workType: 'full-time' | 'part-time'
  categories: string[]
}

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          clerk_id: string
          created_at: string
          updated_at: string
          settings: UserSettings
          working_days: WorkingDay[]
        }
        Insert: {
          id?: string
          clerk_id: string
          created_at?: string
          updated_at?: string
          settings?: UserSettings
          working_days?: WorkingDay[]
        }
        Update: {
          id?: string
          clerk_id?: string
          created_at?: string
          updated_at?: string
          settings?: UserSettings
          working_days?: WorkingDay[]
        }
      }
    }
    Functions: Record<string, never>
  }
} 