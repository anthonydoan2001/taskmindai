'use client';

import { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';
import { api } from '@/lib/trpc/client';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useQueryClient } from '@tanstack/react-query';
import { TRPCClientErrorLike } from '@trpc/client';
import type { DayOfWeek, WorkSchedule, WorkScheduleInput } from '@/types/schedule';
import type { UserPreferences } from '@/types/user';

type WorkType = 'full-time' | 'part-time';

interface WorkScheduleUpdate {
  id: string;
  day?: DayOfWeek;
  start_time?: string;
  end_time?: string;
  is_active?: boolean;
  timezone?: string;
}

const WORK_DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function SettingsContent() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'general';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState<string | null>(null);

  // tRPC hooks with optimistic updates
  const utils = api.useUtils();
  const queryClient = useQueryClient();
  
  const { data: preferences, isLoading: preferencesLoading } = api.user.getPreferences.useQuery();

  const updatePreferences = api.user.updatePreferences.useMutation({
    onMutate: async (newPreferences: UserPreferences) => {
      await utils.user.getPreferences.cancel();
      const previousPreferences = utils.user.getPreferences.getData();
      utils.user.getPreferences.setData(undefined, newPreferences);
      return { previousPreferences };
    },
    onError: (error: TRPCClientErrorLike<any>, _newPreferences: UserPreferences, context: any) => {
      if (context?.previousPreferences) {
        utils.user.getPreferences.setData(undefined, context.previousPreferences);
      }
      setError(error.message);
      // Only show error toast, not success toast
      toast.error('Failed to update preferences', {
        id: 'preferences-update'
      });
    },
    onSuccess: () => {
      // Show success toast only once per successful update
      toast.success('Settings updated successfully', {
        id: 'preferences-update'
      });
    },
    onSettled: () => {
      utils.user.getPreferences.invalidate();
    },
  });

  const { data: workSchedules = [], isLoading: workSchedulesLoading } = api.user.getWorkSchedules.useQuery();

  const { mutate: updateWorkSchedule } = api.user.updateWorkSchedule.useMutation({
    onSuccess: () => {
      utils.user.getWorkSchedules.invalidate();
    },
    onError: (error: TRPCClientErrorLike<any>) => {
      setError('Failed to update work schedule');
      toast.error('Failed to update work schedule', {
        id: 'work-schedule-update'
      });
    }
  });

  const { mutate: deleteWorkSchedule } = api.user.deleteWorkSchedule.useMutation({
    onSuccess: () => {
      utils.user.getWorkSchedules.invalidate();
    },
    onError: (error: TRPCClientErrorLike<any>) => {
      setError('Failed to delete work schedule');
      toast.error('Failed to delete work schedule');
    }
  });

  const { mutate: addWorkSchedule } = api.user.addWorkSchedule.useMutation({
    onSuccess: () => {
      utils.user.getWorkSchedules.invalidate();
    },
    onError: (error: TRPCClientErrorLike<any>) => {
      setError('Failed to create work schedule');
      toast.error('Failed to create work schedule');
    }
  });

  // Add debounced success notification
  const debouncedScheduleSuccess = useDebouncedCallback(() => {
    toast.success('Work schedule updated successfully', {
      id: 'work-schedule-update'
    });
  }, 1000);

  // Add optimistic state updates
  const [optimisticSettings, setOptimisticSettings] = useState<any>(preferences);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (preferences) {
      setOptimisticSettings(preferences);
      setError(null);
    }
  }, [preferences]);

  const displaySettings = optimisticSettings || preferences || {};

  // Debounced update for settings with reduced notifications
  const debouncedHandleSettingsUpdate = useDebouncedCallback(async (updates: Partial<UserPreferences>) => {
    try {
      setIsUpdating(true);
      setError(null);
      
      const currentPreferences = preferences || {
        militaryTime: false,
        workType: 'full-time',
        categories: [],
        theme: 'system',
        timezone: 'UTC'
      };

      const updatedSettings = {
        ...currentPreferences,
        ...updates,
        ...(preferences || {})
      };

      setOptimisticSettings(updatedSettings);
      await updatePreferences.mutateAsync(updatedSettings);
      
      // Toast is now handled in the mutation's onSuccess
    } catch (err) {
      console.error('Settings update error:', err);
      // Toast is now handled in the mutation's onError
      setOptimisticSettings(preferences);
    } finally {
      setIsUpdating(false);
    }
  }, 1000); // Increased debounce time to reduce update frequency

  // Add a dedicated handler for military time toggle with single notification
  const handleMilitaryTimeChange = async (checked: boolean) => {
    try {
      setIsUpdating(true);
      setError(null);
      
      const currentPreferences = preferences || {
        militaryTime: false,
        workType: 'full-time',
        categories: [],
        theme: 'system'
      };

      const updatedSettings = {
        ...currentPreferences,
        militaryTime: checked
      };

      await updatePreferences.mutateAsync(updatedSettings);
      // Toast is now handled in the mutation's onSuccess
    } catch (err) {
      console.error('Time format update error:', err);
      setError('Failed to update time format');
      // Toast is now handled in the mutation's onError
    } finally {
      setIsUpdating(false);
    }
  };

  // Update the work type handler with single notification
  const handleWorkTypeChange = async (value: WorkType) => {
    try {
      setIsUpdating(true);
      setError(null);
      
      const currentPreferences = preferences || {
        militaryTime: false,
        workType: 'full-time',
        categories: [],
        theme: 'system'
      };

      const updatedSettings = {
        ...currentPreferences,
        workType: value
      };

      await updatePreferences.mutateAsync(updatedSettings);
      // Toast is now handled in the mutation's onSuccess
    } catch (err) {
      console.error('Work type update error:', err);
      setError('Failed to update work type');
      // Toast is now handled in the mutation's onError
    } finally {
      setIsUpdating(false);
    }
  };

  // Find or create a schedule for a day
  const getScheduleForDay = (day: DayOfWeek): WorkSchedule | undefined => {
    return workSchedules?.find((schedule: WorkSchedule) => schedule.day === day);
  };

  // Update or create a schedule for a day
  const handleWorkingDayUpdate = async (day: DayOfWeek, data: Omit<WorkScheduleInput, 'day'>) => {
    const schedule = getScheduleForDay(day);
    try {
      // Ensure time format is HH:mm
      const formatTime = (time: string) => {
        if (time.match(/^([01]\d|2[0-3]):([0-5]\d)$/)) return time;
        const hour = time.split(':')[0].padStart(2, '0');
        return `${hour}:00`;
      };

      const formattedData = {
        ...data,
        start_time: formatTime(data.start_time),
        end_time: formatTime(data.end_time),
      };

      if (schedule) {
        await updateWorkSchedule({
          id: schedule.id,
          day,
          start_time: formattedData.start_time,
          end_time: formattedData.end_time,
          is_active: formattedData.is_active,
          timezone: formattedData.timezone || 'UTC'
        });
      } else {
        await addWorkSchedule({
          day,
          start_time: formattedData.start_time,
          end_time: formattedData.end_time,
          is_active: formattedData.is_active,
          timezone: formattedData.timezone || 'UTC'
        });
      }
      // Use debounced success notification instead of immediate toast
      debouncedScheduleSuccess();
    } catch (error) {
      console.error('Failed to update working day:', error);
      // Error toast is handled in mutation callbacks
    }
  };

  const handleWorkingDayDelete = async (day: DayOfWeek) => {
    const schedule = getScheduleForDay(day);
    if (schedule) {
      try {
        await deleteWorkSchedule({ id: schedule.id });
        // Use debounced success notification
        debouncedScheduleSuccess();
      } catch (error) {
        console.error('Failed to delete working day:', error);
        // Error toast is handled in mutation callbacks
      }
    }
  };

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-10" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-5 w-24" />
        <div className="flex space-x-8">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </div>
    </div>
  );

  const LoadingCategoriesSkeleton = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-16" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    </div>
  );

  const LoadingWorkingHoursSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-10" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-5 w-4" />
            <Skeleton className="h-10 w-[100px]" />
          </div>
        </div>
      ))}
      <div className="border-t pt-4">
        <Skeleton className="h-5 w-40" />
      </div>
    </div>
  );

  const formatTime = (time: string, period?: string) => {
    if (!time) return '09:00 AM'; // Default time
    
    // Handle incoming time format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    
    if (displaySettings?.militaryTime) {
      return `${hours.padStart(2, '0')}:${minutes || '00'}`;
    }
    
    // For 12-hour format
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = period || (hour >= 12 ? 'PM' : 'AM');
    return `${displayHour}:${minutes || '00'} ${ampm}`;
  };

  // Generate time options for the select dropdown
  const generateTimeOptions = () => {
    const options = [];
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      const period = i >= 12 ? 'PM' : 'AM';
      const display12Hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
      options.push({
        value: `${hour}:00`,
        label: displaySettings?.militaryTime 
          ? `${hour}:00`
          : `${display12Hour}:00 ${period}`
      });
    }
    return options;
  };

  // Update category handlers with single notifications
  const addCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      setIsUpdating(true);
      setError(null);
      
      const currentPreferences = preferences || {
        militaryTime: false,
        workType: 'full-time',
        categories: [],
        theme: 'system'
      };

      const updatedCategories = [...(currentPreferences.categories || []), newCategory.trim()];
      const updatedSettings = {
        ...currentPreferences,
        categories: updatedCategories
      };

      await updatePreferences.mutateAsync(updatedSettings);
      setNewCategory('');
      // Toast is now handled in the mutation's onSuccess
    } catch (err) {
      console.error('Category addition error:', err);
      setError('Failed to add category');
      // Toast is now handled in the mutation's onError
    } finally {
      setIsUpdating(false);
    }
  };

  const removeCategory = async (category: string) => {
    try {
      setIsUpdating(true);
      setError(null);
      
      const currentPreferences = preferences || {
        militaryTime: false,
        workType: 'full-time',
        categories: [],
        theme: 'system'
      };

      const updatedCategories = (currentPreferences.categories || []).filter(
        (c: string) => c !== category
      );

      const updatedSettings = {
        ...currentPreferences,
        categories: updatedCategories
      };

      await updatePreferences.mutateAsync(updatedSettings);
      // Toast is now handled in the mutation's onSuccess
    } catch (err) {
      console.error('Category removal error:', err);
      setError('Failed to remove category');
      // Toast is now handled in the mutation's onError
    } finally {
      setIsUpdating(false);
    }
  };

  const calculateTotalWeeklyHours = (schedules: any[]) => {
    return (schedules || []).reduce((total, day) => {
      if (!day.is_active) return total;
      const startHour = parseInt(day.start_time.split(':')[0]);
      const endHour = parseInt(day.end_time.split(':')[0]);
      return total + (endHour - startHour);
    }, 0);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="working-hours">Working Hours</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure your general preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {preferencesLoading ? (
                <LoadingSkeleton />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="military-time">Use 24-hour Format</Label>
                    <Switch
                      id="military-time"
                      checked={displaySettings.militaryTime}
                      onCheckedChange={handleMilitaryTimeChange}
                      disabled={isUpdating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Work Type</Label>
                    <RadioGroup
                      value={displaySettings.workType}
                      onValueChange={(value: WorkType) => {
                        handleWorkTypeChange(value);
                      }}
                      className="flex space-x-4"
                      disabled={isUpdating}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="full-time" id="full-time" />
                        <Label htmlFor="full-time">Full Time</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="part-time" id="part-time" />
                        <Label htmlFor="part-time">Part Time</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Categories</CardTitle>
              <CardDescription>Manage your task categories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {preferencesLoading ? (
                <LoadingCategoriesSkeleton />
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={newCategory}
                      onChange={(e) => {
                        setNewCategory(e.target.value);
                        setError('');
                      }}
                      placeholder="New category"
                      className="flex-1"
                      disabled={isUpdating}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newCategory.trim()) {
                          e.preventDefault();
                          addCategory();
                        }
                      }}
                    />
                    <Button
                      onClick={addCategory}
                      disabled={!newCategory.trim() || isUpdating}
                      type="button"
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                    </Button>
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    {(displaySettings.categories || []).map((category: string) => (
                      <div key={category} className="flex items-center justify-between">
                        <span>{category}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCategory(category)}
                          disabled={isUpdating}
                          type="button"
                        >
                          {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="working-hours" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Working Hours</CardTitle>
              <CardDescription>Set your working hours for each day</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {workSchedulesLoading ? (
                <LoadingWorkingHoursSkeleton />
              ) : (
                <div className="space-y-4">
                  {WORK_DAYS.map((day) => {
                    const schedule = getScheduleForDay(day);
                    return (
                      <div key={day} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={!!schedule?.is_active}
                            onCheckedChange={(checked) => {
                              handleWorkingDayUpdate(day, {
                                is_active: checked,
                                start_time: schedule?.start_time || '09:00',
                                end_time: schedule?.end_time || '17:00',
                                timezone: 'UTC'
                              });
                            }}
                            disabled={isUpdating}
                          />
                          <Label>{day.charAt(0).toUpperCase() + day.slice(1)}</Label>
                        </div>
                        {(schedule?.is_active || false) && (
                          <div className="flex items-center space-x-2">
                            <Select
                              value={schedule?.start_time || '09:00'}
                              onValueChange={(time) => {
                                handleWorkingDayUpdate(day, {
                                  is_active: true,
                                  start_time: time,
                                  end_time: schedule?.end_time || '17:00',
                                  timezone: schedule?.timezone || 'UTC'
                                });
                              }}
                              disabled={isUpdating}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue>
                                  {formatTime(schedule?.start_time || '09:00')}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {generateTimeOptions().map(({ value, label }) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span>to</span>
                            <Select
                              value={schedule?.end_time || '17:00'}
                              onValueChange={(time) => {
                                handleWorkingDayUpdate(day, {
                                  is_active: true,
                                  start_time: schedule?.start_time || '09:00',
                                  end_time: time,
                                  timezone: schedule?.timezone || 'UTC'
                                });
                              }}
                              disabled={isUpdating}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue>
                                  {formatTime(schedule?.end_time || '17:00')}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {generateTimeOptions().map(({ value, label }) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                      Total weekly hours: {calculateTotalWeeklyHours(workSchedules)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <SettingsContent />
      </Suspense>
    </ErrorBoundary>
  );
} 