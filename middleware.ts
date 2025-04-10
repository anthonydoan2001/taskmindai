import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',  // Landing page
  '/about(.*)',
  '/features(.*)',
  '/pricing(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Only protect routes that are not public
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
}, { debug: process.env.NODE_ENV === 'development' });

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
