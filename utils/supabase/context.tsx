'use client';

import { useSession } from '@clerk/nextjs';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type { Database } from '@/types/supabase';

const SupabaseContext = createContext<SupabaseClient<Database> | undefined>(undefined);

// Create a singleton instance for the browser client
const browserClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const [supabaseToken, setSupabaseToken] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function updateToken() {
      if (session) {
        try {
          const token = await session.getToken({ template: 'supabase' });
          setSupabaseToken(token);
          setError(null);
        } catch (err) {
          console.error('Failed to get Supabase token:', err);
          setError(err instanceof Error ? err : new Error('Failed to get Supabase token'));
          setSupabaseToken(null);
        }
      } else {
        setSupabaseToken(null);
        setError(null);
      }
    }
    
    updateToken();
  }, [session]);

  const supabase = useMemo(() => {
    return createClient<Database>(
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
  }, [supabaseToken]);

  if (error) {
    // You can replace this with a proper error UI component
    return <div>Error: {error.message}</div>;
  }

  return <SupabaseContext.Provider value={supabase}>{children}</SupabaseContext.Provider>;
}

// Hook to use the Supabase client
export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}

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
          } : {},
        },
      },
    );
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    throw err instanceof Error ? err : new Error('Failed to create Supabase client');
  }
}
