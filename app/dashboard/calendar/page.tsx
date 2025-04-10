'use client';

import { EditCalendar } from "@/components/dashboard/edit-calendar";

export default function CalendarPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      
      <div className="flex-1 p-4 min-h-0">
        <EditCalendar />
      </div>
    </div>
  );
} 