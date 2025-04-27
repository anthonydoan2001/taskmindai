'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EventApi, EventChangeArg, DateSelectArg, EventContentArg } from '@fullcalendar/core';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  backgroundColor?: string;
  textColor?: string;
  classNames?: string[];
  borderColor?: string;
  allDay?: boolean;
  extendedProps?: {
    type?: 'standup' | 'brainstorming' | 'daily-meeting' | 'kick-off' | 'retro' | 'break';
    attendees?: number;
  };
}

interface EventModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  event?: CalendarEvent;
  selectedDates?: DateSelectArg;
}

interface EditCalendarProps {
  onDateSelect?: (selectInfo: DateSelectArg) => void;
}

const eventStyles = {
  'standup': {
    backgroundColor: '#2D2B55',
    textColor: '#ffffff',
    borderColor: '#6C63FF',
  },
  'brainstorming': {
    backgroundColor: '#3A3A3A',
    textColor: '#FFD700',
    borderColor: '#B8860B',
  },
  'daily-meeting': {
    backgroundColor: '#1E4D6B',
    textColor: '#ffffff',
    borderColor: '#00A3FF',
  },
  'kick-off': {
    backgroundColor: '#2B4C3F',
    textColor: '#ffffff',
    borderColor: '#00B894',
  },
  'retro': {
    backgroundColor: '#2D2B55',
    textColor: '#ffffff',
    borderColor: '#6C63FF',
  },
  'break': {
    backgroundColor: '#3A3A3A',
    textColor: '#A0AEC0',
    borderColor: '#718096',
  },
};

export function EditCalendar({ onDateSelect }: EditCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Standup',
      start: new Date(new Date().setHours(9, 0)),
      end: new Date(new Date().setHours(11, 0)),
      extendedProps: { type: 'standup', attendees: 5 },
      ...eventStyles.standup,
    },
    {
      id: '2',
      title: 'Brainstorming',
      start: new Date(new Date().setHours(8, 0)),
      end: new Date(new Date().setHours(10, 0)),
      extendedProps: { type: 'brainstorming', attendees: 3 },
      ...eventStyles.brainstorming,
    },
    {
      id: '3',
      title: 'Daily Meeting',
      start: new Date(new Date().setHours(8, 0)),
      end: new Date(new Date().setHours(9, 0)),
      extendedProps: { type: 'daily-meeting', attendees: 4 },
      ...eventStyles['daily-meeting'],
    },
    {
      id: '4',
      title: 'Kick-off',
      start: new Date(new Date().setHours(10, 0)),
      end: new Date(new Date().setHours(11, 0)),
      extendedProps: { type: 'kick-off', attendees: 6 },
      ...eventStyles['kick-off'],
    },
    {
      id: '5',
      title: 'Retro',
      start: new Date(new Date().setHours(11, 30)),
      end: new Date(new Date().setHours(13, 0)),
      extendedProps: { type: 'retro', attendees: 5 },
      ...eventStyles.retro,
    },
    {
      id: '6',
      title: 'Lunch Break',
      start: new Date(new Date().setHours(13, 0)),
      end: new Date(new Date().setHours(14, 0)),
      extendedProps: { type: 'break' },
      ...eventStyles.break,
    },
  ]);

  const [eventModal, setEventModal] = useState<EventModalState>({
    isOpen: false,
    mode: 'create',
  });

  const [newEventTitle, setNewEventTitle] = useState('');

  const handleEventChange = (info: EventChangeArg) => {
    const event = info.event;
    setEvents((currentEvents: CalendarEvent[]) =>
      currentEvents.map((e: CalendarEvent) =>
        e.id === event.id
          ? {
              ...e,
              title: event.title,
              start: event.start || e.start,
              end: event.end || e.end,
            }
          : e,
      ),
    );
    toast.success('Event updated');
  };

  const handleEventClick = (info: { event: EventApi }) => {
    const event = info.event;
    setEventModal({
      isOpen: true,
      mode: 'edit',
      event: {
        id: event.id,
        title: event.title,
        start: event.start || new Date(),
        end: event.end || new Date(),
        backgroundColor: event.backgroundColor,
        textColor: event.textColor,
        classNames: event.classNames,
        allDay: event.allDay,
        extendedProps: event.extendedProps as any,
      },
    });
    setNewEventTitle(event.title);
  };

  const handleDateSelect = (info: DateSelectArg) => {
    if (onDateSelect) {
      onDateSelect(info);
    }
    setEventModal({
      isOpen: true,
      mode: 'create',
      selectedDates: info,
    });
    setNewEventTitle('');
  };

  const handleSaveEvent = () => {
    if (!newEventTitle.trim()) {
      toast.error('Please enter an event title');
      return;
    }

    if (eventModal.mode === 'create' && eventModal.selectedDates) {
      const newEvent: CalendarEvent = {
        id: Math.random().toString(36).substring(2),
        title: newEventTitle,
        start: eventModal.selectedDates.start,
        end: eventModal.selectedDates.end,
        allDay: eventModal.selectedDates.allDay,
        ...eventStyles['standup'],
        extendedProps: { type: 'standup', attendees: 5 },
      };
      setEvents((currentEvents: CalendarEvent[]) => [...currentEvents, newEvent]);
      toast.success('Event created');
    } else if (eventModal.mode === 'edit' && eventModal.event) {
      setEvents((currentEvents: CalendarEvent[]) =>
        currentEvents.map((e: CalendarEvent) =>
          e.id === eventModal.event?.id ? { ...e, title: newEventTitle } : e,
        ),
      );
      toast.success('Event updated');
    }

    setEventModal({ isOpen: false, mode: 'create' });
    setNewEventTitle('');
  };

  return (
    <div className="h-full bg-[#1E1E1E] text-white">
      <style jsx>{`
        :global(.fc) {
          --fc-border-color: #333333;
          --fc-page-bg-color: #1E1E1E;
          --fc-neutral-bg-color: #252525;
          --fc-neutral-text-color: #FFFFFF;
          --fc-today-bg-color: rgba(108, 99, 255, 0.1);
        }
        :global(.fc-theme-standard td), :global(.fc-theme-standard th) {
          border-color: var(--fc-border-color);
        }
        :global(.fc-timegrid-slot-label) {
          color: #666666;
          font-size: 0.85rem;
        }
        :global(.fc-col-header-cell) {
          padding: 8px 0;
          background-color: var(--fc-neutral-bg-color);
        }
        :global(.fc-toolbar-title) {
          color: #FFFFFF;
          font-size: 1.5rem !important;
        }
        :global(.fc-button) {
          background-color: #333333 !important;
          border-color: #444444 !important;
          color: #FFFFFF !important;
        }
        :global(.fc-button:hover) {
          background-color: #444444 !important;
        }
        :global(.fc-button-active) {
          background-color: #6C63FF !important;
        }
        :global(.fc-event) {
          border-radius: 4px;
          border: none !important;
          padding: 2px 4px;
        }
        :global(.fc-event-title) {
          font-weight: 500;
          padding: 2px 0;
        }
        :global(.fc-event-time) {
          font-size: 0.85rem;
          opacity: 0.9;
        }
        :global(.fc-timegrid-event) {
          min-height: 32px;
        }
      `}</style>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridDay,timeGridWeek',
        }}
        slotMinTime="07:00:00"
        slotMaxTime="18:00:00"
        expandRows={true}
        height="100%"
        events={events}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        nowIndicator={true}
        eventChange={handleEventChange}
        eventClick={handleEventClick}
        select={handleDateSelect}
        slotEventOverlap={false}
        allDaySlot={false}
        slotDuration="00:30:00"
        eventContent={(arg) => {
          const attendees = arg.event.extendedProps?.attendees;
          return (
            <div className="p-1">
              <div className="font-medium">{arg.event.title}</div>
              {attendees && (
                <div className="text-xs opacity-80 mt-1">
                  +{attendees} attendees
                </div>
              )}
            </div>
          );
        }}
        eventClassNames={(arg: EventContentArg): string[] => {
          const type = arg.event.extendedProps?.type as keyof typeof eventStyles;
          return [
            'border-l-4',
            'shadow-sm',
          ];
        }}
      />
      <Dialog
        open={eventModal.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEventModal({ isOpen: false, mode: 'create' });
            setNewEventTitle('');
          }
        }}
      >
        <DialogContent className="bg-[#252525] text-white border-[#333333]">
          <DialogHeader>
            <DialogTitle className="text-white">
              {eventModal.mode === 'create' ? 'Create Event' : 'Edit Event'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white">Event Title</Label>
              <Input
                id="title"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="Enter event title"
                className="bg-[#333333] border-[#444444] text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEventModal({ isOpen: false, mode: 'create' });
                setNewEventTitle('');
              }}
              className="bg-[#333333] text-white border-[#444444] hover:bg-[#444444]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEvent}
              className="bg-[#6C63FF] text-white hover:bg-[#5A52CC]"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
