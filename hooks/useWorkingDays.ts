import { useCallback, useEffect, useState, useRef } from 'react';
import { useUser, useSession } from '@clerk/nextjs';
import { toast } from 'sonner';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useSupabase } from '@/utils/supabase/context';
import type { WorkingDays, DaySchedule } from '@/lib/supabase';

const DEFAULT_WORKING_DAYS: WorkingDays = {
  monday: { start: '09:00', end: '17:00', isWorkingDay: true },
  tuesday: { start: '09:00', end: '17:00', isWorkingDay: true },
  wednesday: { start: '09:00', end: '17:00', isWorkingDay: true },
  thursday: { start: '09:00', end: '17:00', isWorkingDay: true },
  friday: { start: '09:00', end: '17:00', isWorkingDay: true },
  saturday: { start: '09:00', end: '17:00', isWorkingDay: false },
  sunday: { start: '09:00', end: '17:00', isWorkingDay: false }
};

export function useWorkingDays() {
  const { user, isLoaded: clerkLoaded } = useUser();
  const { session } = useSession();
  const supabase = useSupabase();
  const [workingDays, setWorkingDays] = useState<WorkingDays>(DEFAULT_WORKING_DAYS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const hasInitialized = useRef(false);

  // Validate working days structure
  const validateWorkingDays = (days: WorkingDays): WorkingDays => {
    const validDays = { ...DEFAULT_WORKING_DAYS };
    
    // Only copy valid properties from the input
    for (const day of Object.keys(DEFAULT_WORKING_DAYS) as (keyof WorkingDays)[]) {
      if (days[day]) {
        validDays[day] = {
          start: days[day].start || DEFAULT_WORKING_DAYS[day].start,
          end: days[day].end || DEFAULT_WORKING_DAYS[day].end,
          isWorkingDay: typeof days[day].isWorkingDay === 'boolean' ? days[day].isWorkingDay : DEFAULT_WORKING_DAYS[day].isWorkingDay
        };
      }
    }
    
    return validDays;
  };

  // Cleanup function for the subscription
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
  }, []);

  // Setup realtime subscription
  const setupSubscription = useCallback((userId: string) => {
    cleanup();

    channelRef.current = supabase
      .channel(`working_days_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<{ working_days: WorkingDays }>) => {
          const newData = payload.new as { working_days: WorkingDays } | null;
          if (newData?.working_days) {
            setWorkingDays(newData.working_days);
            setError(null);
          }
        },
      )
      .subscribe();
  }, [cleanup, supabase]);

  // Fetch working days from the database
  const fetchWorkingDays = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('working_days, settings')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile not found, create one with default working days
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .upsert({
              user_id: userId,
              settings: {
                militaryTime: false,
                workType: 'full-time',
                categories: ['Work', 'Personal', 'Errands'],
              },
              working_days: DEFAULT_WORKING_DAYS,
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (createError) throw createError;
          
          if (newProfile?.working_days) {
            setWorkingDays(validateWorkingDays(newProfile.working_days));
          }
          return;
        }
        throw error;
      }

      if (data?.working_days) {
        setWorkingDays(validateWorkingDays(data.working_days));
      }
      setError(null);
    } catch (error) {
      console.error('Error fetching working days:', error);
      setError(error as Error);
      toast.error('Failed to fetch working days');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Initialize working days and subscription
  useEffect(() => {
    const userId = user?.id;
    if (!clerkLoaded || !userId || !session) {
      setLoading(false);
      return cleanup;
    }

    // Skip if we've already initialized
    if (hasInitialized.current) return cleanup;
    hasInitialized.current = true;

    // Fetch data and setup subscription
    fetchWorkingDays(userId);
    setupSubscription(userId);

    return cleanup;
  }, [clerkLoaded, session, user?.id, cleanup, fetchWorkingDays, setupSubscription]);

  const updateWorkingDays = useCallback(
    async (newWorkingDays: WorkingDays) => {
      if (!user?.id) {
        console.error('No user ID available');
        toast.error('You must be logged in to update working days');
        return;
      }

      const previousWorkingDays = workingDays;
      try {
        setLoading(true);
        
        // Validate working days format and structure
        if (!newWorkingDays || typeof newWorkingDays !== 'object') {
          throw new Error('Invalid working days format');
        }
        const validatedWorkingDays = validateWorkingDays(newWorkingDays);

        // First fetch the current profile to ensure we have the latest data
        const { data: currentProfile, error: fetchError } = await supabase
          .from('user_profiles')
          .select('working_days, settings, updated_at')
          .eq('user_id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        // Prepare the update data
        const updateData = {
          user_id: user.id,
          working_days: validatedWorkingDays,
          updated_at: new Date().toISOString(),
          settings: currentProfile?.settings || {
            militaryTime: false,
            workType: 'full-time',
            categories: ['Work', 'Personal', 'Errands'],
          },
        };

        // Use upsert to handle both insert and update cases
        const { error: upsertError } = await supabase
          .from('user_profiles')
          .upsert(updateData);

        if (upsertError) throw upsertError;

        // Verify the update
        const { data: verifyData, error: verifyError } = await supabase
          .from('user_profiles')
          .select('working_days')
          .eq('user_id', user.id)
          .single();

        if (verifyError) throw verifyError;

        if (!verifyData?.working_days) {
          throw new Error('Failed to verify working days update');
        }

        // Update local state with verified and validated data
        setWorkingDays(validateWorkingDays(verifyData.working_days));
        setError(null);
        toast.success('Working days updated successfully');
      } catch (error) {
        console.error('Error updating working days:', error);
        setError(error as Error);
        toast.error('Failed to update working days');
        // Revert to previous state on error
        setWorkingDays(previousWorkingDays);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user?.id, supabase, workingDays],
  );

  return {
    workingDays,
    loading: loading && clerkLoaded,
    updateWorkingDays,
    error,
  };
}
