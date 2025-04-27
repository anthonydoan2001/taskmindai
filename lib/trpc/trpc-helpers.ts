import { initTRPC } from '@trpc/server';
import { ZodError } from 'zod';
import { SupabaseClient } from '@supabase/supabase-js';
import superjson from 'superjson';

// Context type for tRPC
export interface TrpcContext {
  supabase: SupabaseClient;
  userId?: string;
  isAdmin?: boolean; // Set to true for admin users
}

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;
  if (!ctx.userId) throw new Error('UNAUTHORIZED');
  return opts.next({ ctx: { ...ctx, userId: ctx.userId } });
}); 