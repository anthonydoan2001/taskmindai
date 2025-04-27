'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, Brain } from 'lucide-react';

export default function TaskInputPage() {
  const [mounted, setMounted] = useState(false);
  const [taskInput, setTaskInput] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Quick Task Input</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Natural Language Input</CardTitle>
            <CardDescription>
              Describe your task naturally and let AI help organize it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-input">Task Description</Label>
              <Textarea
                id="task-input"
                placeholder="e.g., Schedule team meeting for next Tuesday at 2pm about project updates"
                className="min-h-[150px]"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
              />
            </div>
            <Button className="w-full">
              <Brain className="mr-2 h-4 w-4" />
              Process with AI
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Suggestions</CardTitle>
              <CardDescription>Extracted details from your input</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="Team Meeting" disabled />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon" disabled>
                    <Calendar className="h-4 w-4" />
                  </Button>
                  <Input placeholder="Next Tuesday" disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon" disabled>
                    <Clock className="h-4 w-4" />
                  </Button>
                  <Input placeholder="2:00 PM" disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 