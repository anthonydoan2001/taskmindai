import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { toast } from "sonner";

interface TaskInputSidebarProps {
  className?: string;
  initialStartDate?: Date;
  onTaskCreate?: (taskData: any) => Promise<void>;
  onClose?: () => void;
}

interface TaskFormData {
  title: string;
  description: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  isAllDay: boolean;
  priority: string;
  category: string;
}

export function TaskInputSidebar({ 
  className, 
  initialStartDate,
  onTaskCreate,
  onClose 
}: TaskInputSidebarProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    startDate: initialStartDate,
    endDate: undefined,
    isAllDay: false,
    priority: "",
    category: "",
  });

  useEffect(() => {
    if (initialStartDate) {
      setFormData(prev => ({
        ...prev,
        startDate: initialStartDate,
        endDate: (() => {
          const defaultEndDate = new Date(initialStartDate);
          defaultEndDate.setHours(defaultEndDate.getHours() + 1);
          return defaultEndDate;
        })(),
      }));
    }
  }, [initialStartDate]);

  const handleSubmit = async () => {
    if (!formData.title) {
      toast.error("Please enter a task title");
      return;
    }

    if (!formData.startDate) {
      toast.error("Please select a start date");
      return;
    }

    if (!formData.endDate) {
      toast.error("Please select an end date");
      return;
    }

    if (onTaskCreate) {
      await onTaskCreate(formData);
    }
  };

  return (
    <Card className={cn("w-80 p-4 flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Add New Task</h2>
          <p className="text-sm text-muted-foreground">
            Create a new task in your calendar
          </p>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Task Title</Label>
          <Input 
            id="title" 
            placeholder="Enter task title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Enter task description"
            className="resize-none"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="all-day"
            checked={formData.isAllDay}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAllDay: checked }))}
          />
          <Label htmlFor="all-day">All day</Label>
        </div>

        <div className="space-y-2">
          <Label>Start Time</Label>
          <DateTimePicker
            value={formData.startDate}
            onChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
            hideTime={formData.isAllDay}
          />
        </div>

        <div className="space-y-2">
          <Label>End Time</Label>
          <DateTimePicker
            value={formData.endDate}
            onChange={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
            hideTime={formData.isAllDay}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="work">Work</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="study">Study</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full" onClick={handleSubmit}>Add Task</Button>
      </div>
    </Card>
  );
} 