import { useCallback, useEffect, useState, useRef } from 'react';
import { useUser, useSession } from '@clerk/nextjs';
import { toast } from 'sonner';
import { type RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useSupabase } from '@/utils/supabase/context';
import type { UserSettings } from '@/lib/supabase';

const DEFAULT_SETTINGS: UserSettings = {
  militaryTime: false,
  workType: 'full-time',
  categories: ['Work', 'Personal', 'Errands'],
};

export function useSettings() {
  const { user, isLoaded: clerkLoaded } = useUser();
  const { session } = useSession();
  const supabase = useSupabase();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Wait for Clerk to load
    if (!clerkLoaded) return;

    // If Clerk is loaded but no user, we're not authenticated
    if (!user || !session) {
      setLoading(false);
      return;
    }

    // Skip if we've already initialized
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const fetchSettings = async () => {
      try {
        const { data: profiles, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .filter('user_id', 'eq', user.id);

        if (profileError) throw profileError;

        const profile = profiles?.[0];
        
        if (!profile) {
          // Create a new profile with default settings
          const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              settings: DEFAULT_SETTINGS,
              working_days: {
                monday: { start: '09:00', end: '17:00', isWorkingDay: true },
                tuesday: { start: '09:00', end: '17:00', isWorkingDay: true },
                wednesday: { start: '09:00', end: '17:00', isWorkingDay: true },
                thursday: { start: '09:00', end: '17:00', isWorkingDay: true },
                friday: { start: '09:00', end: '17:00', isWorkingDay: true },
                saturday: { start: '09:00', end: '17:00', isWorkingDay: false },
                sunday: { start: '09:00', end: '17:00', isWorkingDay: false }
              }
            })
            .select()
            .single();

          if (insertError) throw insertError;

          if (newProfile?.settings) {
            setSettings(newProfile.settings);
          } else {
            setSettings(DEFAULT_SETTINGS);
          }
          return;
        }

        if (profile?.settings) {
          setSettings(profile.settings);
        } else {
          setSettings(DEFAULT_SETTINGS);
        }

        setError(null);
      } catch (error) {
        console.error('Error in fetchSettings:', error);
        setError(error as Error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    // Subscribe to changes
    const channel = supabase
      .channel('settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: RealtimePostgresChangesPayload<{ settings: UserSettings }>) => {
          const newData = payload.new as { settings: UserSettings } | null;
          if (newData?.settings) {
            setSettings(newData.settings);
            setError(null);
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, clerkLoaded, supabase, session]);

  const updateSettings = useCallback(
    async (newSettings: Partial<UserSettings>) => {
      if (!user?.id) {
        console.error('No user ID available');
        toast.error('You must be logged in to update settings');
        return;
      }

      setLoading(true);
      try {
        // Try to get or create profile
        let currentSettings = DEFAULT_SETTINGS;

        const { data: existingProfile, error: fetchError } = await supabase
          .from('user_profiles')
          .select('settings')
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // Profile doesn't exist, create it
            const { data: newProfile, error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: user.id,
                settings: DEFAULT_SETTINGS,
                working_days: {
                  monday: { start: '09:00', end: '17:00', isWorkingDay: true },
                  tuesday: { start: '09:00', end: '17:00', isWorkingDay: true },
                  wednesday: { start: '09:00', end: '17:00', isWorkingDay: true },
                  thursday: { start: '09:00', end: '17:00', isWorkingDay: true },
                  friday: { start: '09:00', end: '17:00', isWorkingDay: true },
                  saturday: { start: '09:00', end: '17:00', isWorkingDay: false },
                  sunday: { start: '09:00', end: '17:00', isWorkingDay: false }
                }
              })
              .select()
              .single();

            if (insertError) throw insertError;
          } else {
            throw fetchError;
          }
        } else {
          currentSettings = existingProfile.settings || DEFAULT_SETTINGS;
        }

        const updatedSettings = {
          ...currentSettings,
          ...newSettings,
        };

        const { error } = await supabase
          .from('user_profiles')
          .update({
            settings: updatedSettings,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (error) throw error;

        setSettings(updatedSettings);
        toast.success('Settings updated');
      } catch (error) {
        console.error('Error updating settings:', error);
        toast.error('Failed to update settings');
      } finally {
        setLoading(false);
      }
    },
    [user?.id, supabase],
  );

  return {
    settings,
    loading: loading || !clerkLoaded,
    updateSettings,
    error,
  };
}
