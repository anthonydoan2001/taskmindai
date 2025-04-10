export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          stripe_customer_id: string;
        };
        Insert: {
          id: string;
          stripe_customer_id: string;
        };
        Update: {
          id?: string;
          stripe_customer_id?: string;
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
          status: string | null;
          metadata: Json | null;
          price_id: string | null;
          quantity: number | null;
          cancel_at_period_end: boolean | null;
          created: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          ended_at: string | null;
          cancel_at: string | null;
          canceled_at: string | null;
          trial_start: string | null;
          trial_end: string | null;
        };
        Insert: {
          id: string;
          user_id: string;
          status?: string | null;
          metadata?: Json | null;
          price_id?: string | null;
          quantity?: number | null;
          cancel_at_period_end?: boolean | null;
          created?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          ended_at?: string | null;
          cancel_at?: string | null;
          canceled_at?: string | null;
          trial_start?: string | null;
          trial_end?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: string | null;
          metadata?: Json | null;
          price_id?: string | null;
          quantity?: number | null;
          cancel_at_period_end?: boolean | null;
          created?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          ended_at?: string | null;
          cancel_at?: string | null;
          canceled_at?: string | null;
          trial_start?: string | null;
          trial_end?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          billing_address: Json | null;
          payment_method: Json | null;
        };
        Insert: {
          id: string;
          billing_address?: Json | null;
          payment_method?: Json | null;
        };
        Update: {
          id?: string;
          billing_address?: Json | null;
          payment_method?: Json | null;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          created_at: string | null;
          updated_at: string | null;
          settings: Json | null;
          working_days: Json | null;
        };
        Insert: {
          id: string;
          created_at?: string | null;
          updated_at?: string | null;
          settings?: Json | null;
          working_days?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          settings?: Json | null;
          working_days?: Json | null;
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
