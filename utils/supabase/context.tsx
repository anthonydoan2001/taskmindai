'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/nextjs';
import { Database } from '@/types/supabase';

type SupabaseContext = {
  supabase: SupabaseClient<Database>;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

// Create a singleton instance
let supabaseInstance: SupabaseClient<Database> | null = null;
let currentToken: string | null = null;

function getSupabaseClient(supabaseToken: string | null = null) {
  // Only create a new instance if the token changes
  if (supabaseToken !== currentToken) {
    currentToken = supabaseToken;
    supabaseInstance = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: supabaseToken ? {
            Authorization: `Bearer ${supabaseToken}`,
            'Accept': 'application/json',
          } : {},
        },
      },
    );
  }

  return supabaseInstance || createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {},
      },
    },
  );
}

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { getToken, userId } = useAuth();
  const [supabaseToken, setSupabaseToken] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setSupabaseToken(null);
      return;
    }

    const fetchToken = async () => {
      try {
        const token = await getToken({ template: 'supabase' });
        setSupabaseToken(token);
      } catch (error) {
        console.error('Error fetching Supabase token:', error);
        setSupabaseToken(null);
      }
    };

    fetchToken();
  }, [userId, getToken]);

  const supabase = useMemo(() => getSupabaseClient(supabaseToken), [supabaseToken]);

  return (
    <Context.Provider value={{ supabase }}>
      {children}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context.supabase;
};

// Server-side client creation
export function createServerSupabaseClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing required Supabase environment variables for server client');
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    },
  );
}

// Browser-side client creation
export function createBrowserSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          'Accept': 'application/json',
          'Prefer': 'return=minimal'
        },
      },
    },
  );
}

// Server-side client creation with Clerk auth
export async function createClerkSupabaseClientSsr(auth: { getToken: (options?: { template?: string }) => Promise<string | null> }) {
  try {
    const token = await auth.getToken({ template: 'supabase' });
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase environment variables');
    }
    
    return createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: token ? {
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json',
            'Prefer': 'return=minimal'
          } : {
            'Accept': 'application/json',
            'Prefer': 'return=minimal'
          },
        },
      },
    );
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    throw err instanceof Error ? err : new Error('Failed to create Supabase client');
  }
}
