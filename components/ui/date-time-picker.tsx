import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TimePicker } from "./time-picker";

interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  hideTime?: boolean;
}

export function DateTimePicker({ value, onChange, hideTime }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value);

  // Update internal state when value prop changes
  React.useEffect(() => {
    setSelectedDate(value);
  }, [value]);

  // Callback when date changes
  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    if (onChange) {
      onChange(date);
    }
  };

  // Format the date for display
  const formattedDate = selectedDate
    ? format(selectedDate, hideTime ? "PPP" : "PPP p")
    : "";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formattedDate || "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <DatePicker
          mode="single"
          selected={selectedDate}
          onSelect={handleDateChange}
          initialFocus
        />
        {!hideTime && selectedDate && (
          <div className="p-3 border-t">
            <TimePicker
              date={selectedDate}
              setDate={(date: Date) => handleDateChange(date)}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
} 