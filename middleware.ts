import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// List of public routes that don't require authentication
const publicRoutes = ['/', '/about', '/features', '/pricing', '/sign-in', '/sign-up'];

// List of routes to be ignored by the middleware
const ignoredRoutes = [
  '/_next',
  '/favicon.ico',
  '/api/webhooks(.*)',
  '/static(.*)',
  '/images(.*)',
];

const isPublicRoute = createRouteMatcher(publicRoutes);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
}, { debug: process.env.NODE_ENV === 'development' });

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
