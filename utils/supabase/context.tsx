'use client';

import { useSession } from '@clerk/nextjs';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type { Database } from '@/types/supabase';

const SupabaseContext = createContext<SupabaseClient<Database> | undefined>(undefined);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const [supabaseToken, setSupabaseToken] = useState<string | null>(null);

  useEffect(() => {
    if (session.session) {
      session.session.getToken({ template: 'supabase' }).then(setSupabaseToken);
    }
  }, [session.session]);

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
          } : {},
        },
      },
    );
  }, [supabaseToken]);

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
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
    },
  );
}

// Server-side client creation with Clerk auth
export async function createClerkSupabaseClientSsr(auth: { getToken: () => Promise<string | null> }) {
  const token = await auth.getToken();
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
          Authorization: token ? `Bearer ${token}` : '',
        },
      },
    },
  );
}
