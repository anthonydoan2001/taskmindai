'use client';

import { SignUp } from '@clerk/nextjs';
import { useAppSession } from '@/components/providers/session-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function SignUpPage() {
  const { isLoading, isSignedIn } = useAppSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoading, isSignedIn, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Sign Up Form */}
      <div className="flex w-full items-center justify-center lg:w-1/2">
        <div className="mx-auto w-full max-w-md px-6 py-12">
          <h1 className="mb-8 text-center text-3xl font-bold">Create your account</h1>
          <SignUp
            appearance={{
              elements: {
                formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
                card: 'shadow-none',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'border-border hover:bg-muted',
                formFieldInput:
                  'h-10 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                dividerLine: 'bg-border',
                dividerText: 'text-muted-foreground',
                footerActionText: 'text-muted-foreground',
                footerActionLink: 'text-primary hover:text-primary/90',
                identityPreviewText: 'text-foreground',
                identityPreviewEditButton: 'text-primary hover:text-primary/90',
              },
            }}
          />
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:block lg:w-1/2">
        <div className="relative h-full w-full bg-gradient-to-br from-primary/20 to-primary/40">
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <Image
              src="/images/task-planning.svg"
              alt="Task Planning Illustration"
              width={500}
              height={500}
              className="max-w-full rounded-lg object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
