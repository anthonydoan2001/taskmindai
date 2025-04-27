import { inferAsyncReturnType } from '@trpc/server';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { cookies } from 'next/headers';
import { getAuth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function createContext(opts?: FetchCreateContextFnOptions) {
  const defaultReq = new NextRequest(new Request('http://localhost'));
  const req = (opts?.req as NextRequest) ?? defaultReq;
  const { userId } = getAuth(req);

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  return {
    user: userId ? { id: userId } : null,
    userId,
    supabase,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>; 