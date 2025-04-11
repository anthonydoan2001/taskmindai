import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// List of public routes that don't require authentication
const publicRoutes = ['/', '/about', '/features', '/pricing', '/sign-in', '/sign-up(.*)', '/sign-in(.*)'];

// List of routes to be ignored by the middleware
const ignoredRoutes = [
  '/_next',
  '/favicon.ico',
  '/static/(.*)',
  '/images/(.*)',
];

// List of webhook routes that should bypass auth but still be processed
const webhookRoutes = [
  '/api/webhooks/clerk',
  '/api/webhooks/stripe',
];

const isPublicRoute = createRouteMatcher([...publicRoutes, ...webhookRoutes]);
const isIgnoredRoute = createRouteMatcher(ignoredRoutes);

export default clerkMiddleware(async (auth, req) => {
  const url = new URL(req.url);
  
  // Completely ignore certain routes
  if (isIgnoredRoute(req)) {
    return;
  }

  // Allow webhook and public routes to pass through without auth
  if (isPublicRoute(req)) {
    return;
  }

  // Protect all other routes
  await auth.protect();
}, { debug: process.env.NODE_ENV === 'development' });

// Match all routes except static files and Next.js internals
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
