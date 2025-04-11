import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export async function createClerkSupabaseClientSsr(clerkAuth: Awaited<ReturnType<typeof auth>>) {
  const { getToken } = clerkAuth;

  if (!getToken) {
    throw new Error('getToken is required');
  }

  const token = await getToken();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseKey) throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
} 