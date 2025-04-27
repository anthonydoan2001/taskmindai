'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrioritiesPage() {
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
        <h1 className="text-4xl font-bold">Priorities</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Priority Task
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>High Priority</CardTitle>
            <CardDescription>Tasks that need immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No high priority tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medium Priority</CardTitle>
            <CardDescription>Important but not urgent tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No medium priority tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Priority</CardTitle>
            <CardDescription>Tasks to be handled when time permits</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No low priority tasks</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 