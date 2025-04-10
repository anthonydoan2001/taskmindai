'use client';

import { useAuth, useSession } from '@clerk/nextjs';
import { createContext, useContext, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AUTH_ERRORS } from '@/lib/errors';

type SessionContextType = {
  isLoading: boolean;
  isSignedIn: boolean | undefined;
  sessionId: string | null;
};

const SessionContext = createContext<SessionContextType>({
  isLoading: true,
  isSignedIn: undefined,
  sessionId: null,
});

const publicRoutes = ['/', '/about', '/features', '/pricing', '/sign-in', '/sign-up'];

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded: authLoaded, isSignedIn, userId } = useAuth();
  const { session, isLoaded: sessionLoaded } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isLoading = !authLoaded || !sessionLoaded;
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));

  useEffect(() => {
    // Handle session expiration and auth state
    if (!isLoading) {
      if (!isSignedIn && !isPublicRoute) {
        console.warn(AUTH_ERRORS.CLERK.SESSION_EXPIRED);
        const searchParams = new URLSearchParams();
        searchParams.set('redirect_url', pathname);
        router.push(`/sign-in?${searchParams.toString()}`);
      } else if (isSignedIn && (pathname === '/sign-in' || pathname === '/sign-up')) {
        router.push('/dashboard');
      }
    }
  }, [isLoading, isSignedIn, isPublicRoute, pathname, router, userId]);

  return (
    <SessionContext.Provider
      value={{
        isLoading,
        isSignedIn,
        sessionId: session?.id ?? null,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export const useAppSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useAppSession must be used within a SessionProvider');
  }
  return context;
};
