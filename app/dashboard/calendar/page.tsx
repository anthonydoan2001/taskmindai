'use client';

import { EditCalendar } from '@/components/dashboard/edit-calendar';

export default function CalendarPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="min-h-0 flex-1 p-4">
        <EditCalendar />
      </div>
    </div>
  );
}
