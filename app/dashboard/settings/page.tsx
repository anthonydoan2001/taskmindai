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
import { useWorkingDays } from '../../../hooks/useWorkingDays';
import { type WorkingDays, type DaySchedule } from '@/lib/supabase';
import { useSettings } from '../../../hooks/useSettings';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';

// Loading states components
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

const DAYS = [
  { name: 'Monday', value: 'monday' },
  { name: 'Tuesday', value: 'tuesday' },
  { name: 'Wednesday', value: 'wednesday' },
  { name: 'Thursday', value: 'thursday' },
  { name: 'Friday', value: 'friday' },
  { name: 'Saturday', value: 'saturday' },
  { name: 'Sunday', value: 'sunday' },
] as const;

// Create a separate client component for the settings content
function SettingsContent() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'general';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [newCategory, setNewCategory] = useState('');
  const { workingDays, loading: workingDaysLoading, updateWorkingDays } = useWorkingDays();
  const { settings, loading: settingsLoading, updateSettings } = useSettings();

  // Add optimistic state updates
  const [optimisticWorkingDays, setOptimisticWorkingDays] = useState<WorkingDays | null>(null);
  const [optimisticSettings, setOptimisticSettings] = useState<typeof settings>({
    militaryTime: false,
    workType: 'full-time',
    categories: []
  });

  // Add loading state for button actions
  const [isUpdating, setIsUpdating] = useState(false);

  // Add error state and display
  const [error, setError] = useState<string | null>(null);

  // Update optimistic settings when server state changes
  useEffect(() => {
    if (settings) {
      setOptimisticSettings(settings);
      setError(null); // Clear any errors when settings update successfully
    }
  }, [settings]);

  // Use optimistic values if available, otherwise use actual values
  const displayWorkingDays = optimisticWorkingDays || workingDays;
  const displaySettings = {
    militaryTime: optimisticSettings?.militaryTime ?? settings?.militaryTime ?? false,
    workType: optimisticSettings?.workType ?? settings?.workType ?? 'full-time',
    categories: optimisticSettings?.categories ?? settings?.categories ?? [],
  };

  // Debounced update functions
  const debouncedHandleWorkingDayUpdate = useDebouncedCallback(async (dayOfWeek: string, updates: Partial<DaySchedule>) => {
    if (!displayWorkingDays) return;
    
    try {
      setIsUpdating(true);
      setError(null);

      // Get the current day's schedule
      const currentDay = displayWorkingDays[dayOfWeek as keyof WorkingDays];
      if (!currentDay) {
        throw new Error('Invalid day selected');
      }

      // Create new working days object with the update
      const newWorkingDays = {
        ...displayWorkingDays,
        [dayOfWeek]: {
          ...currentDay,
          ...updates,
        },
      };

      // Validate time ranges if both start and end are being updated
      if (updates.start || updates.end) {
        const startTime = updates.start || currentDay.start;
        const endTime = updates.end || currentDay.end;
        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = parseInt(endTime.split(':')[0]);
        
        if (startHour >= endHour) {
          throw new Error('End time must be after start time');
        }
      }

      // Update optimistically
      setOptimisticWorkingDays(newWorkingDays);

      // Attempt the update
      await updateWorkingDays(newWorkingDays);

      // Clear optimistic state on success
      setOptimisticWorkingDays(null);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update working hours';
      setError(errorMessage);
      toast.error(errorMessage);
      // Revert optimistic update on error
      setOptimisticWorkingDays(null);
    } finally {
      setIsUpdating(false);
    }
  }, 500);

  const debouncedHandleSettingsUpdate = useDebouncedCallback(async (updates: Partial<typeof settings>) => {
    try {
      setIsUpdating(true);
      setError(null);
      const updatedSettings = {
        ...settings,
        ...updates,
      };
      setOptimisticSettings(updatedSettings);
      await updateSettings(updatedSettings);
      toast.success('Settings updated successfully');
    } catch (err) {
      const errorMessage = 'Failed to update settings. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      // Revert optimistic update on error
      setOptimisticSettings(settings);
    } finally {
      setIsUpdating(false);
    }
  }, 500);

  // Replace handleWorkingDayUpdate and handleSettingsUpdate with their debounced versions
  const handleWorkingDayUpdate = debouncedHandleWorkingDayUpdate;
  const handleSettingsUpdate = debouncedHandleSettingsUpdate;

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

  const formatTime = (time: string) => {
    if (displaySettings.militaryTime) {
      return time;
    }
    const [hours] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      setIsUpdating(true);
      setError(null);
      const updatedCategories = [...(optimisticSettings.categories || []), newCategory.trim()];
      await handleSettingsUpdate({ categories: updatedCategories });
      setNewCategory('');
      toast.success('Category added successfully');
    } catch (err) {
      const errorMessage = 'Failed to add category';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const removeCategory = async (category: string) => {
    try {
      setIsUpdating(true);
      setError(null);
      const updatedCategories = optimisticSettings.categories?.filter(c => c !== category) || [];
      await handleSettingsUpdate({ categories: updatedCategories });
      toast.success('Category removed successfully');
    } catch (err) {
      const errorMessage = 'Failed to remove category';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const calculateTotalWeeklyHours = (workingDays: WorkingDays) => {
    return Object.values(workingDays).reduce((total: number, day: DaySchedule) => {
      if (!day.isWorkingDay) return total;
      const startHour = parseInt(day.start.split(':')[0]);
      const endHour = parseInt(day.end.split(':')[0]);
      return total + (endHour - startHour);
    }, 0);
  };

  const handleWorkTypeChange = async (value: 'full-time' | 'part-time') => {
    try {
      setIsUpdating(true);
      setError(null);

      // Update settings optimistically
      const updatedSettings = {
        ...displaySettings,
        workType: value,
      };
      handleSettingsUpdate(updatedSettings);

      // Update working hours based on work type
      const newWorkingDays = {
        ...displayWorkingDays,
        monday: {
          ...displayWorkingDays.monday,
          isWorkingDay: value === 'full-time',
          start: '09:00',
          end: '17:00',
        },
        tuesday: {
          ...displayWorkingDays.tuesday,
          isWorkingDay: value === 'full-time',
          start: '09:00',
          end: '17:00',
        },
        wednesday: {
          ...displayWorkingDays.wednesday,
          isWorkingDay: value === 'full-time',
          start: '09:00',
          end: '17:00',
        },
        thursday: {
          ...displayWorkingDays.thursday,
          isWorkingDay: value === 'full-time',
          start: '09:00',
          end: '17:00',
        },
        friday: {
          ...displayWorkingDays.friday,
          isWorkingDay: value === 'full-time',
          start: '09:00',
          end: '17:00',
        },
        saturday: {
          ...displayWorkingDays.saturday,
          isWorkingDay: false,
          start: '09:00',
          end: '17:00',
        },
        sunday: {
          ...displayWorkingDays.sunday,
          isWorkingDay: false,
          start: '09:00',
          end: '17:00',
        },
      };

      setOptimisticWorkingDays(newWorkingDays);
      await updateWorkingDays(newWorkingDays);
    } catch (err) {
      setError('Failed to update work type. Please try again.');
      // Revert optimistic updates
      setOptimisticWorkingDays(null);
      setOptimisticSettings(settings);
    } finally {
      setIsUpdating(false);
    }
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
              {settingsLoading ? (
                <LoadingSkeleton />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="military-time">Use 24-hour Format</Label>
                    <Switch
                      id="military-time"
                      checked={displaySettings.militaryTime}
                      onCheckedChange={(checked) => {
                        handleSettingsUpdate({ militaryTime: checked });
                      }}
                      disabled={isUpdating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Work Type</Label>
                    <RadioGroup
                      value={displaySettings.workType}
                      onValueChange={(value: 'full-time' | 'part-time') => {
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
              {settingsLoading ? (
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
                    {displaySettings.categories.map((category) => (
                      <div key={category} className="flex items-center justify-between">
                        <span>{category}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            removeCategory(category);
                          }}
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
              {workingDaysLoading ? (
                <LoadingWorkingHoursSkeleton />
              ) : !displayWorkingDays ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Failed to load working hours. Please refresh the page.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {DAYS.map(({ name, value }) => {
                    const day = displayWorkingDays[value as keyof WorkingDays];
                    if (!day) return null;
                    return (
                      <div key={value} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={day.isWorkingDay}
                            onCheckedChange={(checked) => {
                              handleWorkingDayUpdate(value, {
                                isWorkingDay: checked,
                                start: day.start,
                                end: day.end,
                              });
                            }}
                            disabled={isUpdating}
                          />
                          <Label>{name}</Label>
                        </div>
                        {day.isWorkingDay && (
                          <div className="flex items-center space-x-2">
                            <Select
                              value={day.start}
                              onValueChange={(time) => {
                                handleWorkingDayUpdate(value, {
                                  start: time,
                                  end: day.end,
                                });
                              }}
                              disabled={isUpdating}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder={formatTime(day.start)} />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => (
                                  <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                                    {formatTime(`${i.toString().padStart(2, '0')}:00`)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span>to</span>
                            <Select
                              value={day.end}
                              onValueChange={(time) => {
                                handleWorkingDayUpdate(value, {
                                  start: day.start,
                                  end: time,
                                });
                              }}
                              disabled={isUpdating}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder={formatTime(day.end)} />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => (
                                  <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                                    {formatTime(`${i.toString().padStart(2, '0')}:00`)}
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
                      Total weekly hours: {calculateTotalWeeklyHours(displayWorkingDays)}
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

// Main page component with Suspense boundary
export default function SettingsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
} 