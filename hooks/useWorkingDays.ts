import { useCallback, useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { toast } from 'sonner'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { useSupabase } from '@/utils/supabase/context'
import type { WorkingDay } from '@/lib/supabase'

const DEFAULT_WORKING_DAYS: WorkingDay[] = [
  { dayOfWeek: '0', startTime: '09:00', endTime: '17:00', isWorkingDay: false },
  { dayOfWeek: '1', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
  { dayOfWeek: '2', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
  { dayOfWeek: '3', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
  { dayOfWeek: '4', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
  { dayOfWeek: '5', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
  { dayOfWeek: '6', startTime: '09:00', endTime: '17:00', isWorkingDay: false }
]

export function useWorkingDays() {
  const { user, isLoaded: clerkLoaded } = useUser()
  const supabase = useSupabase()
  const [workingDays, setWorkingDays] = useState<WorkingDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clerkLoaded) return

    if (!user?.id) {
      setLoading(false)
      return
    }

    const fetchWorkingDays = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('user_profiles')
          .select('working_days')
          .eq('clerk_id', user.id)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            // Profile not found, create one with default working days
            const { error: createError } = await supabase
              .from('user_profiles')
              .insert({
                clerk_id: user.id,
                working_days: DEFAULT_WORKING_DAYS
              })

            if (createError) throw createError
            setWorkingDays(DEFAULT_WORKING_DAYS)
            return
          }
          throw error
        }

        setWorkingDays(data.working_days)
      } catch (error) {
        console.error('Error fetching working days:', error)
        toast.error('Failed to fetch working days')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkingDays()

    // Subscribe to changes
    const channel = supabase
      .channel('working_days_changes')
      .on(
        'postgres_changes',
        {
          event: '*',  // Listen for all events
          schema: 'public',
          table: 'user_profiles',
          filter: `clerk_id=eq.${user.id}`
        },
        (payload: RealtimePostgresChangesPayload<{ working_days: WorkingDay[] }>) => {
          console.log('Received working days update:', payload)
          const newData = payload.new as { working_days: WorkingDay[] } | null
          if (newData?.working_days) {
            console.log('Setting new working days:', newData.working_days)
            setWorkingDays(newData.working_days)
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user?.id, clerkLoaded, supabase])

  const updateWorkingDays = useCallback(
    async (newWorkingDays: WorkingDay[]) => {
      if (!user?.id) return

      try {
        setLoading(true)
        // Validate working days format
        if (!Array.isArray(newWorkingDays) || newWorkingDays.length !== 7) {
          throw new Error('Invalid working days format')
        }

        const { error } = await supabase
          .from('user_profiles')
          .update({ working_days: newWorkingDays })
          .eq('clerk_id', user.id)

        if (error) throw error

        // Update local state immediately
        setWorkingDays(newWorkingDays)
        toast.success('Working days updated successfully')
      } catch (error) {
        console.error('Error updating working days:', error)
        toast.error('Failed to update working days')
      } finally {
        setLoading(false)
      }
    },
    [user?.id, supabase]
  )

  return {
    workingDays,
    loading: loading || !clerkLoaded,
    updateWorkingDays
  }
} 