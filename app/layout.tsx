import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { SessionProvider } from "@/components/providers/session-provider";
import { SupabaseProvider } from "@/utils/supabase/context";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "TaskMind AI",
  description: "Convert natural language goals into personalized calendar plans",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider>
            <SessionProvider>
              <SupabaseProvider>
                <main className="min-h-screen bg-white dark:bg-gray-900">
                  {children}
                </main>
              </SupabaseProvider>
            </SessionProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
