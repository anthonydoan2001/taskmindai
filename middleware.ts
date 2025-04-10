import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes
const isPublicRoute = createRouteMatcher([
  '/',
  '/about',
  '/pricing',
  '/contact',
  '/api/webhooks(.*)',
]);

export default clerkMiddleware((auth, req) => {
  // Only require auth if not a public route
  if (isPublicRoute(req)) return;

  // If it's not public, Clerk will enforce auth automatically
});


export const config = {
  matcher: [
    '/((?!_next|.*\\..*).*)', // excludes _next and static files
    '/',                     // include root
    '/(api|trpc)(.*)',       // include all api routes
    '/(dashboard|settings)(.*)', // protect these areas
  ],
};
