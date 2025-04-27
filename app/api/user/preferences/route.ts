import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { strictRateLimiter } from '@/lib/rate-limit';
import { createAuditLog } from '@/lib/audit-log';
import { headers } from 'next/headers';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Validation schema for user preferences
const preferencesSchema = z.object({
  calendar: z.object({
    defaultView: z.enum(['day', 'week', 'month']).optional(),
    workingHours: z.object({
      start: z.string(),
      end: z.string()
    }).optional(),
    timezone: z.string().optional(),
    firstDayOfWeek: z.number().min(0).max(6).optional(),
  }).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    reminderTiming: z.array(z.number()).optional(),
    types: z.object({
      taskDue: z.boolean().optional(),
      meetingReminder: z.boolean().optional(),
      aiSuggestions: z.boolean().optional(),
    }).optional(),
  }).optional(),
  aiScheduling: z.object({
    defaultMeetingDuration: z.number().optional(),
    minimumBreakTime: z.number().optional(),
    focusTimeBlocks: z.array(z.object({
      start: z.string(),
      end: z.string(),
      days: z.array(z.number().min(0).max(6)),
    })).optional(),
    taskPriority: z.enum(['high', 'medium', 'low']).optional(),
  }).optional(),
  ui: z.object({
    language: z.string().optional(),
    dashboardLayout: z.record(z.string(), z.any()).optional(),
    defaultViews: z.record(z.string(), z.string()).optional(),
  }).optional(),
});

function getRequestMetadata(req: Request) {
  const headersList = headers();
  return {
    ip_address: headersList.get('x-forwarded-for') || 'unknown',
    user_agent: headersList.get('user-agent') || 'unknown',
  };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { success, limit, reset, remaining } = await strictRateLimiter.limit(
      `preferences_get_${session.userId}`
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests', reset },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      );
    }

    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', session.userId)
      .single();

    if (error) {
      logger.error('Error fetching user preferences', error);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json(preferences || {});
  } catch (error) {
    logger.error('Unexpected error in GET /api/user/preferences', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { success, limit, reset, remaining } = await strictRateLimiter.limit(
      `preferences_update_${session.userId}`
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests', reset },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      );
    }

    const body = await req.json();
    const metadata = getRequestMetadata(req);

    try {
      preferencesSchema.parse(body);
    } catch (error) {
      await createAuditLog({
        user_id: session.userId,
        action: 'update_preferences',
        resource: 'user_preferences',
        details: { attempted_preferences: body },
        status: 'failure',
        error_message: 'Invalid preferences data',
        ...metadata,
      });

      return NextResponse.json(
        { error: 'Invalid preferences data', details: error },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: session.userId,
        ...body,
        updated_at: new Date().toISOString()
      });

    if (error) {
      await createAuditLog({
        user_id: session.userId,
        action: 'update_preferences',
        resource: 'user_preferences',
        details: { attempted_preferences: body },
        status: 'failure',
        error_message: error.message,
        ...metadata,
      });

      logger.error('Error updating user preferences', error);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    await createAuditLog({
      user_id: session.userId,
      action: 'update_preferences',
      resource: 'user_preferences',
      details: { updated_fields: Object.keys(body) },
      status: 'success',
      ...metadata,
    });

    const { data: updatedPreferences, error: fetchError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', session.userId)
      .single();

    if (fetchError) {
      logger.error('Error fetching updated preferences', fetchError);
      return NextResponse.json(
        { error: 'Preferences updated but failed to fetch updated data' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedPreferences);
  } catch (error) {
    logger.error('Unexpected error in PATCH /api/user/preferences', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 