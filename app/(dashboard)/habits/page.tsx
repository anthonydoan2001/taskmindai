'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HabitsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Habits</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Habit
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Habits</CardTitle>
            <CardDescription>Track your daily recurring activities</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No daily habits created yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Habits</CardTitle>
            <CardDescription>Track your weekly goals and routines</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No weekly habits created yet</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 