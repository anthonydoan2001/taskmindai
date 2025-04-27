'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DailyCheckIn } from '@/components/main/daily-check-in';
import { ViewCalendar } from '@/components/main/view-calendar';

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);

  // Handle initial mount and localStorage check
  useEffect(() => {
    setMounted(true);
    const lastCheckIn = window.localStorage.getItem('lastCheckIn');
    const today = new Date().toDateString();

    if (lastCheckIn !== today) {
      setShowCheckIn(true);
    }
  }, []);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Let&apos;s plan your day
        </h1>
        <Button onClick={() => router.push('/dashboard/task')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Quick Add Task
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <ViewCalendar />

        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-xl font-semibold">Today&apos;s Focus</h2>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">No tasks scheduled for today</p>
            </div>
          </div>
        </div>
      </div>

      {showCheckIn && mounted && (
        <DailyCheckIn
          onComplete={() => {
            setShowCheckIn(false);
            window.localStorage.setItem('lastCheckIn', new Date().toDateString());
          }}
        />
      )}
    </div>
  );
}
