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
import { type WorkingDay } from '@/lib/supabase';
import { useSettings } from '../../../hooks/useSettings';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { ModeToggle } from '@/components/ui/mode-toggle';

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

// Create a separate client component for the settings content
function SettingsContent() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'general';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [newCategory, setNewCategory] = useState('');
  const { workingDays, loading: workingDaysLoading, updateWorkingDays } = useWorkingDays();
  const { settings, loading: settingsLoading, updateSettings } = useSettings();

  // Add optimistic state updates
  const [optimisticWorkingDays, setOptimisticWorkingDays] = useState<WorkingDay[]>([]);
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
  const displayWorkingDays = optimisticWorkingDays.length > 0 ? optimisticWorkingDays : workingDays;
  const displaySettings = {
    militaryTime: optimisticSettings?.militaryTime ?? settings?.militaryTime ?? false,
    workType: optimisticSettings?.workType ?? settings?.workType ?? 'full-time',
    categories: optimisticSettings?.categories ?? settings?.categories ?? [],
  };

  // Wrap update functions with optimistic updates
  const handleWorkingDayUpdate = async (dayOfWeek: string, updates: Partial<WorkingDay>) => {
    try {
      setIsUpdating(true);
      setError(null);
      const newWorkingDays = displayWorkingDays.map((day) => {
        if (day.dayOfWeek === dayOfWeek) {
          return { ...day, ...updates };
        }
        return day;
      });

      // Validate time ranges
      if (updates.startTime && updates.endTime) {
        const start = parseInt(updates.startTime.split(':')[0]);
        const end = parseInt(updates.endTime.split(':')[0]);
        if (start >= end) {
          throw new Error('End time must be after start time');
        }
      }

      setOptimisticWorkingDays(newWorkingDays);
      await updateWorkingDays(newWorkingDays);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update working hours. Please try again.',
      );
      // Revert optimistic update on error
      setOptimisticWorkingDays([]);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSettingsUpdate = async (updates: Partial<typeof settings>) => {
    try {
      setIsUpdating(true);
      setError(null);
      const updatedSettings = {
        ...settings,
        ...updates,
      };
      setOptimisticSettings(updatedSettings);
      await updateSettings(updatedSettings);
    } catch (err) {
      setError('Failed to update settings. Please try again.');
      // Revert optimistic update on error
      setOptimisticSettings(settings);
    } finally {
      setIsUpdating(false);
    }
  };

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

  const getDayName = (dayOfWeek: string) => {
    const date = new Date(2024, 0, parseInt(dayOfWeek) + 1);
    return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
  };

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

  const parseTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return { hours, minutes };
  };

  const validateCategory = (category: string) => {
    if (!category.trim()) {
      setError('Category name cannot be empty');
      return false;
    }
    if (displaySettings.categories.includes(category)) {
      setError('Category already exists');
      return false;
    }
    setError('');
    return true;
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      setIsUpdating(true);
      setError(null);
      const updatedCategories = [...(optimisticSettings.categories || []), newCategory.trim()];
      await handleSettingsUpdate({ categories: updatedCategories });
      setNewCategory('');
    } catch (err) {
      setError('Failed to add category');
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
    } catch (err) {
      setError('Failed to remove category');
    } finally {
      setIsUpdating(false);
    }
  };

  const calculateTotalWeeklyHours = (workingDays: WorkingDay[]) => {
    let total = 0;

    for (const day of workingDays) {
      if (!day?.isWorkingDay || !day?.startTime || !day?.endTime) {
        continue;
      }

      try {
        const [startHour] = day.startTime.split(':').map(Number);
        const [endHour] = day.endTime.split(':').map(Number);

        if (!isNaN(startHour) && !isNaN(endHour)) {
          total += Math.max(0, endHour - startHour);
        }
      } catch (error) {
        console.error('Error calculating hours for day:', day, error);
      }
    }

    return total;
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

      // Update working hours optimistically
      const newWorkingDays = displayWorkingDays.map((day) => ({
        ...day,
        isWorkingDay:
          value === 'full-time'
            ? ['1', '2', '3', '4', '5'].includes(day.dayOfWeek)
            : day.isWorkingDay,
        startTime: value === 'full-time' ? '09:00' : day.startTime,
        endTime: value === 'full-time' ? '17:00' : day.endTime,
      }));

      setOptimisticWorkingDays(newWorkingDays);
      await updateWorkingDays(newWorkingDays);
    } catch (err) {
      setError('Failed to update work type. Please try again.');
      // Revert optimistic updates
      setOptimisticWorkingDays([]);
      setOptimisticSettings(settings);
    } finally {
      setIsUpdating(false);
    }
  };

  const DAYS = [
    { name: 'Sunday', value: '0' },
    { name: 'Monday', value: '1' },
    { name: 'Tuesday', value: '2' },
    { name: 'Wednesday', value: '3' },
    { name: 'Thursday', value: '4' },
    { name: 'Friday', value: '5' },
    { name: 'Saturday', value: '6' },
  ] as const;

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
        <TabsList>
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
              ) : (
                <div className="space-y-4">
                  {DAYS.map(({ name, value }) => {
                    const day = displayWorkingDays.find((d) => d.dayOfWeek === value) || {
                      dayOfWeek: value,
                      isWorkingDay: false,
                      startTime: '09:00',
                      endTime: '17:00',
                    };

                    return (
                      <div key={value} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={day.isWorkingDay}
                            onCheckedChange={(checked) => {
                              handleWorkingDayUpdate(value, {
                                isWorkingDay: checked,
                                startTime: day.startTime,
                                endTime: day.endTime,
                              });
                            }}
                            disabled={isUpdating}
                          />
                          <Label>{name}</Label>
                        </div>
                        {day.isWorkingDay && (
                          <div className="flex items-center space-x-2">
                            <Select
                              value={day.startTime}
                              onValueChange={(time) => {
                                handleWorkingDayUpdate(value, {
                                  startTime: time,
                                  endTime: day.endTime,
                                });
                              }}
                              disabled={isUpdating}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue />
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
                              value={day.endTime}
                              onValueChange={(time) => {
                                handleWorkingDayUpdate(value, {
                                  startTime: day.startTime,
                                  endTime: time,
                                });
                              }}
                              disabled={isUpdating}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue />
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
