// tRPC API route handler for Next.js 14 App Router (fetch adapter)
import { appRouter } from '@/lib/trpc/routers/_app';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createContext } from '@/lib/trpc/context';
import { NextRequest } from 'next/server';

export const GET = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  });

export const POST = GET; 