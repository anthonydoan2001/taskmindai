'use client';

import { EditCalendar } from '@/components/main/edit-calendar';
import { TaskInputSidebar } from '@/components/main/task-input-sidebar';
import { useEffect, useState } from 'react';
import { DateSelectArg } from '@fullcalendar/core';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CalendarPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDate(selectInfo.start);
    setSidebarOpen(true);
  };

  const handleTaskCreate = async (taskData: any) => {
    try {
      // TODO: Implement task creation with Supabase
      toast.success('Task created successfully');
      setSidebarOpen(false);
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="min-h-0 flex-1 p-4">
        <EditCalendar onDateSelect={handleDateSelect} />
      </div>
      <TaskInputSidebar 
        className={cn("border-l transition-all duration-300", 
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        )}
        initialStartDate={selectedDate}
        onTaskCreate={handleTaskCreate}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  );
}
