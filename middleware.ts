import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Create a matcher for public routes
const publicRoutes = createRouteMatcher([
  "/",
  "/api/webhooks(.*)",
  "/about",
  "/pricing",
  "/blog(.*)",
  "/contact",
  "/sign-in(.*)",  // Allow access to sign-in page and its subpaths
  "/sign-up(.*)",  // Allow access to sign-up page and its subpaths
]);

export default clerkMiddleware((auth, req) => {
  if (publicRoutes(req)) {
    return NextResponse.next();
  }
  return NextResponse.next();
});

// Stop Middleware running on static files and _next
export const config = {
  matcher: [
    "/((?!.*\\.[\\w]+$|_next).*)", // Skip static files and _next
    "/",                            // Match root
    "/(api|trpc)(.*)",             // Match API and tRPC routes
  ],
};
