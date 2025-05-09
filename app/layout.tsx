import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { SessionProvider } from '@/components/providers/session-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from 'sonner';
import SupabaseProvider from '@/utils/supabase/context';
import { TRPCProvider } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'TaskMind AI',
  description: 'Convert natural language goals into personalized calendar plans',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          redirectUrl="/dashboard"
          afterSignInUrl="/dashboard"
          afterSignUpUrl="/dashboard"
        >
          <SupabaseProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <SessionProvider>
                <TRPCProvider>
                  <main className="min-h-screen bg-white dark:bg-gray-900">{children}</main>
                  <Toaster richColors />
                </TRPCProvider>
              </SessionProvider>
            </ThemeProvider>
          </SupabaseProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
