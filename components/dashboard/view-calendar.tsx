'use client';

import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";

export function ViewCalendar() {
  // TODO: Replace with actual events from your data source
  const events = [
    {
      title: 'Meeting with Team',
      start: new Date(new Date().setHours(10, 0)),
      end: new Date(new Date().setHours(11, 30)),
    },
    {
      title: 'Project Review',
      start: new Date(new Date().setHours(14, 0)),
      end: new Date(new Date().setHours(15, 30)),
    },
  ];

  return (
    <Card className="p-4">
      <Calendar 
        events={events}
        editable={false}
      />
    </Card>
  );
} 