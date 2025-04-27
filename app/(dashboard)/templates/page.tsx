'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, Copy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TemplatesPage() {
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
        <h1 className="text-4xl font-bold">Task Templates</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="relative">
          <CardHeader>
            <CardTitle>Work Templates</CardTitle>
            <CardDescription>Common work-related task patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No work templates created</p>
          </CardContent>
        </Card>

        <Card className="relative">
          <CardHeader>
            <CardTitle>Personal Templates</CardTitle>
            <CardDescription>Recurring personal task patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No personal templates created</p>
          </CardContent>
        </Card>

        <Card className="relative">
          <CardHeader>
            <CardTitle>Project Templates</CardTitle>
            <CardDescription>Project-specific task patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No project templates created</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">Recently Used Templates</h2>
        <div className="rounded-lg border">
          <div className="p-4 text-sm text-muted-foreground">
            No templates have been used yet
          </div>
        </div>
      </div>
    </div>
  );
} 