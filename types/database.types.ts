export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preferences: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'email' | 'in_app' | 'push'
          message: string
          is_read: boolean
          trigger_event: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'email' | 'in_app' | 'push'
          message: string
          is_read?: boolean
          trigger_event?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'email' | 'in_app' | 'push'
          message?: string
          is_read?: boolean
          trigger_event?: string | null
          created_at?: string
        }
      }
      plan_tiers: {
        Row: {
          id: string
          name: string
          monthly_price_cents: number
          max_ai_requests: number
          max_calendars: number
          max_notifications: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          monthly_price_cents?: number
          max_ai_requests: number
          max_calendars: number
          max_notifications: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          monthly_price_cents?: number
          max_ai_requests?: number
          max_calendars?: number
          max_notifications?: number
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          status: 'active' | 'canceled' | 'past_due' | 'trialing'
          current_period_end: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status: 'active' | 'canceled' | 'past_due' | 'trialing'
          current_period_end: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          current_period_end?: string
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          context: Json | null
          ip_address: string | null
          user_agent: string | null
          success: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          context?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          success: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          context?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          success?: boolean
          created_at?: string
        }
      }
      schedules: {
        Row: {
          id: string
          user_id: string
          title: string | null
          start_time: string
          end_time: string
          recurrence: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          start_time: string
          end_time: string
          recurrence?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          start_time?: string
          end_time?: string
          recurrence?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      analytics: {
        Row: {
          id: string
          user_id: string
          task_completion_rate: number
          time_spent: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_completion_rate: number
          time_spent: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_completion_rate?: number
          time_spent?: number
          created_at?: string
        }
      }
      rate_limits: {
        Row: {
          user_id: string
          profile_ops_count: number
          preference_ops_count: number
          last_reset: string
        }
        Insert: {
          user_id: string
          profile_ops_count?: number
          preference_ops_count?: number
          last_reset?: string
        }
        Update: {
          user_id?: string
          profile_ops_count?: number
          preference_ops_count?: number
          last_reset?: string
        }
      }
      work_schedules: {
        Row: {
          id: string;
          user_id: string;
          day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
          start_time: string;
          end_time: string;
          is_active: boolean;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
          start_time: string;
          end_time: string;
          is_active?: boolean;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          day?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
          start_time?: string;
          end_time?: string;
          is_active?: boolean;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    ? (PublicSchema['Tables'] & PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema['Enums'] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never;
