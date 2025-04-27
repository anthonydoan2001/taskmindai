import { Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
}

export function TimePicker({ date, setDate }: TimePickerProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className="flex items-end gap-2">
      <div className="grid gap-1 text-center">
        <Label htmlFor="hours" className="text-xs">Hours</Label>
        <Select
          value={date.getHours().toString()}
          onValueChange={(value) => {
            const newDate = new Date(date);
            newDate.setHours(parseInt(value));
            setDate(newDate);
          }}
        >
          <SelectTrigger id="hours" className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {hours.map((hour) => (
              <SelectItem key={hour} value={hour.toString()}>
                {hour.toString().padStart(2, "0")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="minutes" className="text-xs">Minutes</Label>
        <Select
          value={date.getMinutes().toString()}
          onValueChange={(value) => {
            const newDate = new Date(date);
            newDate.setMinutes(parseInt(value));
            setDate(newDate);
          }}
        >
          <SelectTrigger id="minutes" className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {minutes.map((minute) => (
              <SelectItem key={minute} value={minute.toString()}>
                {minute.toString().padStart(2, "0")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Clock className="ml-2 h-4 w-4 opacity-50" />
    </div>
  );
} 