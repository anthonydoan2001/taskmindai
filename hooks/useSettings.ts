import { useCallback, useEffect, useState } from 'react';
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

  useEffect(() => {
    // Wait for Clerk to load
    if (!clerkLoaded) return;

    // If Clerk is loaded but no user, we're not authenticated
    if (!user || !session) {
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        console.log('Fetching settings for user:', user.id);
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('settings, id')
          .eq('clerk_id', user.id)
          .single();

        if (profileError) {
          console.log('Profile error:', profileError);
          // Only throw if it's not a "no rows returned" error
          if (profileError.code !== 'PGRST116') {
            throw profileError;
          }
          // If no profile exists, the webhook should have created it
          // Let's wait a bit and try again
          await new Promise(resolve => setTimeout(resolve, 2000));
          const { data: retryProfile, error: retryError } = await supabase
            .from('user_profiles')
            .select('settings, id')
            .eq('clerk_id', user.id)
            .single();

          if (retryError) {
            throw retryError;
          }

          if (retryProfile?.settings) {
            setSettings(retryProfile.settings);
          } else {
            console.warn('No settings found after retry, using defaults');
            setSettings(DEFAULT_SETTINGS);
          }
        } else {
          console.log('Existing profile found:', profile);
          if (profile?.settings) {
            setSettings(profile.settings);
          } else {
            console.warn('Profile found but no settings, using defaults');
            setSettings(DEFAULT_SETTINGS);
          }
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
          filter: `clerk_id=eq.${user.id}`,
        },
        (payload: RealtimePostgresChangesPayload<{ settings: UserSettings }>) => {
          console.log('Received settings update:', payload);
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
  }, [user?.id, clerkLoaded, supabase]);

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
          .eq('clerk_id', user.id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // Profile doesn't exist, create it
            console.log('Creating new profile for settings update');
            const { data: newProfile, error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                clerk_id: user.id,
                settings: DEFAULT_SETTINGS,
                working_days: [
                  { dayOfWeek: '0', startTime: '09:00', endTime: '17:00', isWorkingDay: false },
                  { dayOfWeek: '1', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
                  { dayOfWeek: '2', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
                  { dayOfWeek: '3', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
                  { dayOfWeek: '4', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
                  { dayOfWeek: '5', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
                  { dayOfWeek: '6', startTime: '09:00', endTime: '17:00', isWorkingDay: false },
                ],
              })
              .select()
              .single();

            if (insertError) {
              console.error('Error creating profile:', insertError);
              throw insertError;
            }
            console.log('New profile created:', newProfile);
          } else {
            console.error('Error fetching profile:', fetchError);
            throw fetchError;
          }
        } else {
          currentSettings = existingProfile.settings || DEFAULT_SETTINGS;
        }

        const updatedSettings = {
          ...currentSettings,
          ...newSettings,
        };

        console.log('Updating settings to:', updatedSettings);

        const { data, error } = await supabase
          .from('user_profiles')
          .update({
            settings: updatedSettings,
            updated_at: new Date().toISOString(),
          })
          .eq('clerk_id', user.id)
          .select();

        if (error) {
          console.error('Error updating profile:', error);
          throw error;
        }

        console.log('Update response:', data);
        setSettings(updatedSettings);
        toast.success('Settings updated');
      } catch (error) {
        console.error('Error updating settings:', error);
        toast.error('Failed to update settings');
      } finally {
        setLoading(false);
      }
    },
    [user?.id],
  );

  return {
    settings,
    loading: loading || !clerkLoaded,
    updateSettings,
    error,
  };
}
