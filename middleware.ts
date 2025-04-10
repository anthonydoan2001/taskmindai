import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define protected routes - everything under dashboard and settings
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/settings(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // Skip middleware for public routes
  if (
    pathname === '/' ||                   // Landing page
    pathname.startsWith('/about') ||      // About page
    pathname.startsWith('/pricing') ||    // Pricing page
    pathname.startsWith('/contact') ||    // Contact page
    pathname.startsWith('/sign-in') ||    // Sign in pages
    pathname.startsWith('/sign-up') ||    // Sign up pages
    pathname.startsWith('/api/webhooks')  // Webhook endpoints
  ) {
    return;
  }

  // If it's a protected route, require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};
