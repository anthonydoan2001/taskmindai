export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          billing_address: Json | null;
          payment_method: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          billing_address?: Json | null;
          payment_method?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          billing_address?: Json | null;
          payment_method?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'email' | 'in_app' | 'push';
          message: string;
          is_read: boolean;
          trigger_event: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'email' | 'in_app' | 'push';
          message: string;
          is_read?: boolean;
          trigger_event?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'email' | 'in_app' | 'push';
          message?: string;
          is_read?: boolean;
          trigger_event?: string | null;
          created_at?: string;
        };
      };
      plan_tiers: {
        Row: {
          id: string;
          name: string;
          monthly_price_cents: number;
          max_ai_requests: number;
          max_calendars: number;
          max_notifications: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          monthly_price_cents?: number;
          max_ai_requests: number;
          max_calendars: number;
          max_notifications: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          monthly_price_cents?: number;
          max_ai_requests?: number;
          max_calendars?: number;
          max_notifications?: number;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          active: boolean;
          name: string;
          description: string | null;
          image: string | null;
          metadata: Json | null;
        };
        Insert: {
          id: string;
          active?: boolean;
          name: string;
          description?: string | null;
          image?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          active?: boolean;
          name?: string;
          description?: string | null;
          image?: string | null;
          metadata?: Json | null;
        };
      };
      prices: {
        Row: {
          id: string;
          product_id: string;
          active: boolean;
          description: string | null;
          unit_amount: number | null;
          currency: string | null;
          type: string | null;
          interval: string | null;
          interval_count: number | null;
          trial_period_days: number | null;
          metadata: Json | null;
        };
        Insert: {
          id: string;
          product_id: string;
          active?: boolean;
          description?: string | null;
          unit_amount?: number | null;
          currency?: string | null;
          type?: string | null;
          interval?: string | null;
          interval_count?: number | null;
          trial_period_days?: number | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          product_id?: string;
          active?: boolean;
          description?: string | null;
          unit_amount?: number | null;
          currency?: string | null;
          type?: string | null;
          interval?: string | null;
          interval_count?: number | null;
          trial_period_days?: number | null;
          metadata?: Json | null;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          status: 'active' | 'canceled' | 'past_due' | 'trialing';
          current_period_end: string;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status: 'active' | 'canceled' | 'past_due' | 'trialing';
          current_period_end: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: 'active' | 'canceled' | 'past_due' | 'trialing';
          current_period_end?: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
