'use client';

import { useAuth, useSession } from "@clerk/nextjs";
import { createContext, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AUTH_ERRORS } from "@/lib/errors";

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

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { session, isLoaded: sessionLoaded } = useSession();
  const router = useRouter();

  const isLoading = !authLoaded || !sessionLoaded;

  useEffect(() => {
    // Handle session expiration
    if (authLoaded && sessionLoaded && !isSignedIn && !isLoading) {
      console.warn(AUTH_ERRORS.CLERK.SESSION_EXPIRED);
      router.push("/sign-in");
    }
  }, [authLoaded, sessionLoaded, isSignedIn, isLoading, router]);

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
    throw new Error("useAppSession must be used within a SessionProvider");
  }
  return context;
}; 