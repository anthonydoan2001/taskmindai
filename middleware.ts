import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define protected routes - everything under dashboard and settings
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/settings(.*)']);

// Define public routes that should never require authentication
const isPublicRoute = createRouteMatcher([
  '/',                    // Landing page
  '/about',               // About page
  '/pricing',             // Pricing page
  '/contact',             // Contact page
  '/api/webhooks(.*)',    // Webhook endpoints
  '/sign-in(.*)',         // Sign in pages
  '/sign-up(.*)',         // Sign up pages
]);

export default clerkMiddleware(async (auth, req) => {
  // If it's a protected route, require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(html?|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Include API routes
    '/(api|trpc)(.*)',
  ],
};
