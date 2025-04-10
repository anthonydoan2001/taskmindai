"use client"

import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from './button';

interface CalendarProps {
  events?: any[];
  editable?: boolean;
  onEventChange?: (info: any) => void;
  onEventClick?: (info: any) => void;
  onDateSelect?: (info: any) => void;
  onAddEvent?: () => void;
  className?: string;
}

interface CalendarHeaderProps {
  onAddEvent?: () => void;
  date: Date;
  onNavigate?: (action: 'prev' | 'next' | 'today') => void;
}

function CalendarHeader({ onAddEvent, date, onNavigate }: CalendarHeaderProps) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const today = new Date();

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-6">
        <div className="flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden min-w-[70px]">
          <div className="uppercase text-xs font-medium text-white bg-black dark:bg-gray-900 w-full text-center py-1">
            {format(today, 'MMM')}
          </div>
          <div className="text-4xl font-medium text-center py-2">
            {format(today, 'd')}
          </div>
        </div>
        <div className="flex flex-col">
          <div className="text-base font-medium">
            {format(date, 'MMMM yyyy')}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {format(monthStart, 'MMM d, yyyy')} - {format(monthEnd, 'MMM d, yyyy')}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border border-border overflow-hidden">
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-none border-r"
            onClick={() => onNavigate?.('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-none px-3"
            onClick={() => onNavigate?.('today')}
          >
            Today
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-none border-l"
            onClick={() => onNavigate?.('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center rounded-lg border border-border overflow-hidden">
          <Button variant="ghost" size="sm" className="rounded-none px-3">
            Month view
          </Button>
        </div>

        <Button onClick={onAddEvent} size="sm" className="bg-black text-white hover:bg-black/90">
          <Plus className="h-4 w-4 mr-1" />
          Add event
        </Button>
      </div>
    </div>
  );
}

export function Calendar({
  events = [],
  editable = false,
  onEventChange,
  onEventClick,
  onDateSelect,
  onAddEvent,
  className
}: CalendarProps) {
  const calendarRef = useRef<any>(null);
  const { theme } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const calendar = calendarRef.current;
    if (calendar) {
      const api = calendar.getApi();
      api.setOption('theme', theme === 'dark');
    }
  }, [theme]);

  const handleNavigate = (action: 'prev' | 'next' | 'today') => {
    const calendar = calendarRef.current;
    if (calendar) {
      const api = calendar.getApi();
      if (action === 'prev') {
        api.prev();
      } else if (action === 'next') {
        api.next();
      } else {
        api.today();
      }
      setCurrentDate(api.getDate());
    }
  };

  return (
    <div className={cn("flex flex-col h-full rounded-lg bg-card overflow-hidden", className)}>
      <CalendarHeader 
        onAddEvent={onAddEvent} 
        date={currentDate}
        onNavigate={handleNavigate}
      />
      <div className="flex-1 overflow-hidden">
        <style jsx global>{`
          .fc {
            --fc-border-color: hsl(var(--border));
            --fc-page-bg-color: transparent;
            --fc-neutral-bg-color: transparent;
            --fc-today-bg-color: transparent;
            height: 100%;
            font-family: var(--font-sans);
          }
          .fc .fc-toolbar {
            display: none;
          }
          .fc .fc-view {
            border-top: 1px solid var(--fc-border-color);
          }
          .fc .fc-day {
            padding: 0.25rem;
          }
          .fc .fc-day-today {
            background: transparent !important;
          }
          .fc .fc-daygrid-day-number {
            font-size: 0.875rem;
            padding: 0.75rem;
            color: var(--foreground);
          }
          .fc .fc-col-header-cell {
            padding: 0.75rem;
            background: transparent;
            border-bottom: 1px solid var(--fc-border-color);
          }
          .fc .fc-col-header-cell-cushion {
            padding: 0;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--muted-foreground);
            text-transform: capitalize;
          }
          .fc .fc-daygrid-day-frame {
            padding: 0.25rem;
            min-height: 100px;
          }
          .fc .fc-daygrid-day-events {
            margin-top: 0.25rem;
            padding: 0 0.25rem;
          }
          .fc .fc-event {
            border: none;
            padding: 0.125rem 0.25rem;
            font-size: 0.75rem;
            border-radius: 3px;
          }
          .fc .fc-daygrid-more-link {
            font-size: 0.75rem;
            color: var(--primary);
            font-weight: 500;
            padding: 0.25rem;
          }
          .fc-theme-standard td, 
          .fc-theme-standard th {
            border: 1px solid var(--fc-border-color);
          }
          .fc-theme-standard .fc-scrollgrid {
            border: none;
          }
          .fc .fc-day-other .fc-daygrid-day-number {
            opacity: 0.5;
          }
        `}</style>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={false}
          events={events}
          editable={editable}
          selectable={editable}
          selectMirror={true}
          dayMaxEvents={3}
          weekends={true}
          expandRows={true}
          height="100%"
          eventClick={onEventClick}
          select={onDateSelect}
          eventChange={onEventChange}
          nowIndicator={true}
          eventDisplay="block"
          fixedWeekCount={false}
          showNonCurrentDates={true}
          dayHeaderFormat={{ weekday: 'short' }}
          datesSet={(arg) => setCurrentDate(arg.view.currentStart)}
        />
      </div>
    </div>
  );
}
