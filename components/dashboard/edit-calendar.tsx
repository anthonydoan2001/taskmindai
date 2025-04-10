'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
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

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  backgroundColor?: string;
  textColor?: string;
  classNames?: string[];
  borderColor?: string;
}

interface EventChangeInfo {
  event: CalendarEvent;
  oldEvent?: CalendarEvent;
}

interface DateSelectInfo {
  start: Date;
  end: Date;
  allDay: boolean;
}

interface EventModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  event?: CalendarEvent;
  selectedDates?: DateSelectInfo;
}

const eventColors = {
  standupMeeting: {
    backgroundColor: '#F3F4F6',
    textColor: '#374151',
    borderLeft: '3px solid #374151',
  },
  houseInspection: {
    backgroundColor: '#FEF3C7',
    textColor: '#92400E',
    borderLeft: '3px solid #92400E',
  },
  deepWork: {
    backgroundColor: '#DBEAFE',
    textColor: '#1E40AF',
    borderLeft: '3px solid #1E40AF',
  },
  lunch: {
    backgroundColor: '#D1FAE5',
    textColor: '#065F46',
    borderLeft: '3px solid #065F46',
  },
  meeting: {
    backgroundColor: '#FEE2E2',
    textColor: '#991B1B',
    borderLeft: '3px solid #991B1B',
  },
};

export function EditCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Monday standup',
      start: new Date(new Date().setHours(9, 0)),
      end: new Date(new Date().setHours(9, 30)),
      backgroundColor: eventColors.standupMeeting.backgroundColor,
      textColor: eventColors.standupMeeting.textColor,
      classNames: ['border-l-[3px] border-l-gray-700'],
    },
    {
      id: '2',
      title: 'House inspection',
      start: new Date(new Date().setHours(10, 30)),
      end: new Date(new Date().setHours(11, 30)),
      backgroundColor: eventColors.houseInspection.backgroundColor,
      textColor: eventColors.houseInspection.textColor,
      classNames: ['border-l-[3px] border-l-amber-600'],
    },
    {
      id: '3',
      title: 'Deep work',
      start: new Date(new Date().setHours(13, 0)),
      end: new Date(new Date().setHours(15, 0)),
      backgroundColor: eventColors.deepWork.backgroundColor,
      textColor: eventColors.deepWork.textColor,
      classNames: ['border-l-[3px] border-l-blue-700'],
    },
    {
      id: '4',
      title: 'Lunch with team',
      start: new Date(new Date().setHours(12, 0)),
      end: new Date(new Date().setHours(13, 0)),
      backgroundColor: eventColors.lunch.backgroundColor,
      textColor: eventColors.lunch.textColor,
      classNames: ['border-l-[3px] border-l-emerald-700'],
    },
  ]);

  const [eventModal, setEventModal] = useState<EventModalState>({
    isOpen: false,
    mode: 'create',
  });

  const [newEventTitle, setNewEventTitle] = useState('');

  const handleEventChange = (info: EventChangeInfo) => {
    const { event } = info;
    setEvents((currentEvents) =>
      currentEvents.map((e) =>
        e.id === event.id
          ? {
              ...e,
              title: event.title,
              start: event.start,
              end: event.end,
            }
          : e,
      ),
    );
    toast.success('Event updated');
  };

  const handleEventClick = (event: CalendarEvent) => {
    setEventModal({
      isOpen: true,
      mode: 'edit',
      event,
    });
    setNewEventTitle(event.title);
  };

  const handleDateSelect = (info: DateSelectInfo) => {
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
        backgroundColor: eventColors.meeting.backgroundColor,
        textColor: eventColors.meeting.textColor,
        classNames: ['border-l-[3px] border-l-red-700'],
      };
      setEvents((currentEvents) => [...currentEvents, newEvent]);
      toast.success('Event created');
    } else if (eventModal.mode === 'edit' && eventModal.event) {
      setEvents((currentEvents) =>
        currentEvents.map((e) =>
          e.id === eventModal.event?.id ? { ...e, title: newEventTitle } : e,
        ),
      );
      toast.success('Event updated');
    }

    setEventModal({ isOpen: false, mode: 'create' });
    setNewEventTitle('');
  };

  return (
    <div className="h-full">
      <Calendar
        events={events}
        editable={true}
        onEventChange={handleEventChange}
        onEventClick={handleEventClick}
        onDateSelect={handleDateSelect}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {eventModal.mode === 'create' ? 'Create Event' : 'Edit Event'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                className="col-span-3"
                placeholder="Enter event title"
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
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEvent}>
              {eventModal.mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
