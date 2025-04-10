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

// Match all routes except public assets and api routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/data (RSC data files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|_next/data|favicon.ico|public).*)',
  ],
};
