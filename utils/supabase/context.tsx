'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { useAuth, useSession } from '@clerk/nextjs';
import { Database } from '@/types/supabase';

type SupabaseContext = {
  supabase: SupabaseClient<Database>;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

let supabaseClientSingleton: SupabaseClient<Database> | null = null;

function getSupabaseClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables');
  }

  if (supabaseClientSingleton === null) {
    supabaseClientSingleton = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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

  return supabaseClientSingleton;
}

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getToken } = useAuth();
  const { session } = useSession();
  const [supabase] = useState(() => getSupabaseClient());

  useEffect(() => {
    const updateSupabaseAuthHeader = async () => {
      try {
        if (session) {
          const token = await getToken({ template: 'supabase' });
          if (token) {
            supabase.auth.setSession({
              access_token: token,
              refresh_token: '',
            });
          }
        }
      } catch (error) {
        console.error('Error updating Supabase auth header:', error);
      }
    };

    updateSupabaseAuthHeader();
  }, [session, getToken, supabase.auth]);

  const value = useMemo(() => ({ supabase }), [supabase]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider');
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
          'Accept': 'application/vnd.pgrst.object+json',
          'Prefer': 'return=representation'
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
            'Accept': 'application/vnd.pgrst.object+json',
            'Prefer': 'return=representation'
          } : {
            'Accept': 'application/vnd.pgrst.object+json',
            'Prefer': 'return=representation'
          },
        },
      },
    );
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    throw err instanceof Error ? err : new Error('Failed to create Supabase client');
  }
}
