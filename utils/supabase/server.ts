import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

export function createServerSupabaseClient() {
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
        headers: {
          'Accept': 'application/json',
          'Prefer': 'return=minimal'
        },
      },
    }
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