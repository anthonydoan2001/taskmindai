'use client';

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DailyCheckIn } from "@/components/dashboard/daily-check-in";
import { ViewCalendar } from "@/components/dashboard/view-calendar";

export default function DashboardPage() {
  const router = useRouter();
  const [showCheckIn, setShowCheckIn] = useState(false);

  useEffect(() => {
    // Show daily check-in popup if not completed today
    const lastCheckIn = localStorage.getItem('lastCheckIn');
    const today = new Date().toDateString();
    
    if (lastCheckIn !== today) {
      setShowCheckIn(true);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button onClick={() => router.push('/dashboard/task')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Quick Add Task
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <ViewCalendar />

        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Today's Focus</h2>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">No tasks scheduled for today</p>
            </div>
          </div>
        </div>
      </div>

      {showCheckIn && (
        <DailyCheckIn 
          onComplete={() => {
            setShowCheckIn(false);
            localStorage.setItem('lastCheckIn', new Date().toDateString());
          }} 
        />
      )}
    </div>
  );
} 