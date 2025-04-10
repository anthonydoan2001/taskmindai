'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

interface DailyCheckInProps {
  onComplete: () => void;
}

export function DailyCheckIn({ onComplete }: DailyCheckInProps) {
  const [open, setOpen] = useState(true);
  const [goals, setGoals] = useState('');

  const handleComplete = () => {
    // Here you would typically save the goals to your backend
    setOpen(false);
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Daily Check-In</DialogTitle>
          <DialogDescription>
            What would you like to accomplish today? Setting clear goals helps you stay focused and
            productive.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Enter your goals for today..."
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter>
          <Button onClick={handleComplete}>Start My Day</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
